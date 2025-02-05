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
    public function get_card_by_set_number(string $set, string $number): ?Card {
        try {
            $data = $this->scryfall_client->resolve_card_id($set, $number);
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

        // Convert from raw data to Card objects if needed
        $card_objects = array_map(
            function ($card_data) {
                if ($card_data instanceof Card) {
                    return $card_data;
                }

                // Create new Card object preserving the current state
                $card = new Card($card_data);
                if (isset($card_data['quantity'])) {
                    $card->set_quantity($card_data['quantity']);
                }
                if (isset($card_data['section'])) {
                    $card->set_section($card_data['section']);
                }
                if (isset($card_data['foil'])) {
                    $card->set_foil($card_data['foil']);
                }
                return $card;
            },
            $cards
        );

        // Sort cards based on multiple criteria
        usort(
            $card_objects,
            function (Card $a, Card $b) {
                $a_weight = $a->get_sort_weight();
                $b_weight = $b->get_sort_weight();

                // Compare section weights
                if ($a_weight['section_weight'] !== $b_weight['section_weight']) {
                    return $a_weight['section_weight'] - $b_weight['section_weight'];
                }

                // Compare type weights
                if ($a_weight['type_weight'] !== $b_weight['type_weight']) {
                    return $a_weight['type_weight'] - $b_weight['type_weight'];
                }

                // Compare CMC
                if ($a_weight['cmc'] !== $b_weight['cmc']) {
                    return $a_weight['cmc'] - $b_weight['cmc'];
                }

                // Compare names
                return strcmp($a_weight['name'], $b_weight['name']);
            }
        );

        // Convert back to block format
        return array_map(
            function (Card $card) {
                return $card->to_block_format();
            },
            $card_objects
        );
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
                
                // First try to get the card by set/number
                $scryfall_data = $this->scryfall_client->resolve_card_id(
                    $card_data['name'],
                    $card_data['set'],
                    $card_data['number']
                );

                if (!$scryfall_data) {
                    // Fallback to name lookup
                    $scryfall_data = $this->scryfall_client->get_card_by_name(
                        $card_data['name'],
                        $card_data['set']
                    );
                }

                if (!$scryfall_data) {
                    throw new \Exception('Card not found');
                }

                // Cache the result
                $this->cache_service->store_card($scryfall_data);

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
