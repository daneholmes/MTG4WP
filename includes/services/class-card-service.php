<?php

namespace mtg4wp\Services;

use mtg4wp\Models\Card;

class CardService
{
    private ScryfallClient $scryfall_client;

    public function __construct(ScryfallClient $scryfall_client)
    {
        $this->scryfall_client = $scryfall_client;
    }

    // Get a card by Scryfall ID
    public function get_card_by_id(string $id): ?Card {
        try {
            $data = $this->scryfall_client->get_card($id);
            return $data ? new Card($data) : null;
        } catch (\Exception $e) {
            error_log(sprintf(
                'l4m4w ID lookup error: %s (id: %s)',
                $e->getMessage(),
                $id
            ));
            return null;
        }
    }

    // Look up a card by name and optional set
    public function get_card_by_name(string $name, ?string $set = null): ?Card {
        try {
            $data = $this->scryfall_client->get_card_by_name($name, $set);
            return $data ? new Card($data) : null;
        } catch (\Exception $e) {
            error_log(sprintf(
                'l4m4w lookup error: %s (name: %s, set: %s)',
                $e->getMessage(),
                $name,
                $set ?? 'none'
            ));
            return null;
        }
    }

    // Lookup a card by set code and collector number
    public function get_card_by_set_id(string $set, string $number): ?Card {
        try {
            $data = $this->scryfall_client->get_card_by_set_id($set, $number);
            return $data ? new Card($data) : null;
        } catch (\Exception $e) {
            error_log(sprintf(
                'l4m4w set/number lookup error: %s (set: %s, number: %s)',
                $e->getMessage(),
                $set,
                $number
            ));
            return null;
        }
    }

    // Sort a deck of cards
    public function sort_deck(array $cards): array
    {
        if (empty($cards)) {
            return [];
        }
    
        // Define section weights
        $section_weights = [
            'commander'  => 0,
            'mainboard' => 1,
            'sideboard' => 2,
            'maybeboard'=> 3,
            'token'     => 4,
        ];
    
        // Define type weights
        $type_weights = [
            'creature'     => 0,
            'planeswalker' => 1,
            'battle'       => 2,
            'artifact'     => 3,
            'enchantment'  => 4,
            'instant'      => 5,
            'sorcery'      => 6,
            'land'         => 7,
            'other'        => 8,
        ];
    
        // Create a new array to preserve immutability
        $sorted_cards = $cards;
    
        usort($sorted_cards, function ($a, $b) use ($section_weights, $type_weights) {
            // Compare sections
            $a_section = $section_weights[$a['section'] ?? 'mainboard'] ?? 999;
            $b_section = $section_weights[$b['section'] ?? 'mainboard'] ?? 999;
            
            if ($a_section !== $b_section) {
                return $a_section - $b_section;
            }
    
            // Compare types
            $a_type = $type_weights[$a['primary_type'] ?? 'other'] ?? 999;
            $b_type = $type_weights[$b['primary_type'] ?? 'other'] ?? 999;
            
            if ($a_type !== $b_type) {
                return $a_type - $b_type;
            }
    
            // Compare CMC
            $a_cmc = floatval($a['cmc'] ?? 0);
            $b_cmc = floatval($b['cmc'] ?? 0);
            
            if ($a_cmc !== $b_cmc) {
                return $a_cmc - $b_cmc;
            }
    
            // Compare names
            return strcmp($a['name'] ?? '', $b['name'] ?? '');
        });
    
        // Sanitize and validate the sorted data
        return array_map(function ($card) {
            return wp_parse_args($card, [
                'id' => '',
                'name' => '',
                'type_line' => '',
                'primary_type' => 'other',
                'cmc' => 0,
                'faces' => [],
                'layout' => 'normal',
                'isDoubleFaced' => false,
                'quantity' => 1,
                'foil' => false,
                'section' => 'mainboard',
                'currentFace' => 0,
            ]);
        }, $sorted_cards);
    }

    // Import a deck list
    public function import_deck(string $deck_list): array
    {
        $lines = array_filter(explode("\n", $deck_list));
        $cards = [];
        $errors = [];

        foreach ($lines as $index => $line) {
            try {
                $card_data = $this->parse_deck_list_line($line);
                $scryfall_data = null;

                // First try to get the card by set/number if both are provided
                if (!empty($card_data['set']) && !empty($card_data['number'])) {
                    $scryfall_data = $this->scryfall_client->get_card_by_set_id(
                        $card_data['set'],
                        $card_data['number']
                    );
                }

                // Fallback to name lookup if set/number lookup failed or wasn't possible
                if (!$scryfall_data) {
                    $scryfall_data = $this->scryfall_client->get_card_by_name(
                        $card_data['name'],
                        $card_data['set'] ?? null
                    );
                }

                if (!$scryfall_data) {
                    throw new \Exception(
                        sprintf(
                            __('Card "%s" not found', 'l4m4w'),
                            $card_data['name']
                        )
                    );
                }

                $card = new Card($scryfall_data);
                $card->set_quantity($card_data['quantity']);
                $card->set_section($card_data['section']);
                $card->set_foil($card_data['foil']);

                $cards[] = $card;
            } catch (\Exception $e) {
                $errors[] = [
                    'line'    => $index + 1,
                    'content' => $line,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return [
            'cards'  => $cards,
            'errors' => $errors,
        ];
    }

    //Parse a single line from a deck list
    private function parse_deck_list_line(string $line): array
    {
        $line = trim($line);
        $pattern = '/^(\d+)\s+([^(]+?)\s+\(([^)]+)\)\s+([\w\-★]+)(?:\s+\*F\*)?(?:\s+\[([^\]]+)\])?$/';
        if (!preg_match($pattern, $line, $matches)) {
            throw new \Exception('Invalid line format');
        }

        return [
            'quantity' => (int) $matches[1],
            'name'     => trim($matches[2]),
            'set'      => strtolower($matches[3]),
            'number'   => str_replace('★', '', $matches[4]),
            'foil'     => strpos($line, '*F*') !== false,
            'section'  => isset($matches[5]) ? strtolower($matches[5]) : 'mainboard',
        ];
    }

    // Log errors with context
    private function log_error(
        string $type,
        string $id = '',
        string $name = '',
        string $set = '',
        string $message = ''
    ): void {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'l4m4w Card Service Error [%s]: ID="%s" Name="%s" Set="%s" Message="%s"',
                $type,
                $id,
                $name,
                $set,
                $message
            ));
        }
    }
}
