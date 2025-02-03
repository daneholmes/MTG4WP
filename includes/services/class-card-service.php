<?php

namespace MTG4WP\Services;

use MTG4WP\Models\Card;

class CardService
{
    private $scryfall_client;
    private $cache_service;
    public function __construct(ScryfallClient $scryfall_client, CacheService $cache_service)
    {
        $this->scryfall_client = $scryfall_client;
        $this->cache_service = $cache_service;
    }

    // Get a card by name and optional set/number
    public function get_card(string $name, ?string $set = null, ?string $number = null): ?Card
    {
        try {
            // Normalize inputs
            $name = trim($name);
            $set = $set ? trim($set) : null;
            $number = $number ? trim($number) : null;
            // Check cache first
            $cached_data = $this->cache_service->get_card($name, $set, $number);
            if ($cached_data) {
                $this->log_cache_status($name, $set, $number, true);
                return new Card($cached_data);
            }
            $this->log_cache_status($name, $set, $number, false);
            // Fetch from Scryfall
            $scryfall_data = $this->scryfall_client->fetch_card($name, $set, $number);
            if (!$scryfall_data) {
                return null;
            }
            // Cache the result
            $this->cache_service->store_card($scryfall_data);
            return new Card($scryfall_data);
        } catch (\Exception $e) {
            $this->log_error($name, $set, $number, $e->getMessage());
            return null;
        }
    }

    // Sort a deck of cards
    public function sort_deck(array $cards): array
    {
        if (empty($cards)) {
            return [];
        }
        // Convert from raw data to Card objects if needed.
        $card_objects = array_map(
            function ($card) {
                return $card instanceof Card ? $card : new Card($card);
            },
            $cards
        );

        // Sort cards based on multiple criteria.
        usort(
            $card_objects,
            function (Card $a, Card $b) {
                $a_weight = $a->get_sort_weight();
                $b_weight = $b->get_sort_weight();

                // Compare section weights.
                if ($a_weight['section_weight'] !== $b_weight['section_weight']) {
                    return $a_weight['section_weight'] - $b_weight['section_weight'];
                }

                // Compare type weights.
                if ($a_weight['type_weight'] !== $b_weight['type_weight']) {
                    return $a_weight['type_weight'] - $b_weight['type_weight'];
                }

                // Compare CMC.
                if ($a_weight['cmc'] !== $b_weight['cmc']) {
                    return $a_weight['cmc'] - $b_weight['cmc'];
                }

                // Compare names.
                return strcmp($a_weight['name'], $b_weight['name']);
            }
        );

        // Convert back to block format.
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
                $card = $this->get_card(
                    $card_data['name'],
                    $card_data['set'],
                    $card_data['number']
                );

                if (! $card) {
                    throw new \Exception('Card not found');
                }

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

    // Parse a single line from a deck list
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

    private function log_cache_status(string $name, ?string $set, ?string $number, bool $hit): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'MTG4WP Cache %s: %s (%s-%s)',
                $hit ? 'HIT' : 'MISS',
                $name,
                $set ?? 'null',
                $number ?? 'null'
            ));
        }
    }

    private function log_error(string $name, ?string $set, ?string $number, string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'MTG4WP Error fetching card %s (%s-%s): %s',
                $name,
                $set ?? 'null',
                $number ?? 'null',
                $message
            ));
        }
    }
}
