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

    /**
     * Get a card by name and optional set/number.
     * 
     * Search priorities:
     * 1. If set AND number: Direct cache/API lookup
     * 2. If set AND name: Scryfall set-specific fuzzy search
     * 3. If only name: Scryfall fuzzy search for canonical version
     * 
     * @param string $name Card name (optional if set and number provided)
     * @param string|null $set Set code
     * @param string|null $number Collector number
     * @return Card|null
     */
    public function get_card(string $name = '', ?string $set = null, ?string $number = null): ?Card
    {
        try {
            // Normalize inputs
            $name = trim($name);
            $set = $set ? strtolower(trim($set)) : null;
            $number = $number ? trim($number) : null;

            $this->log_search_attempt($name, $set, $number);

            // Case 1: We have set and number - most efficient path
            if ($set && $number) {
                return $this->get_card_by_set_number($set, $number);
            }

            // Case 2: We have set and name
            if ($set && $name) {
                return $this->get_card_by_set_name($name, $set);
            }

            // Case 3: We only have name
            if ($name) {
                return $this->get_card_by_name($name);
            }

            return null;
        } catch (\Exception $e) {
            $this->log_error($name, $set, $number, $e->getMessage());
            return null;
        }
    }

    /**
     * Sort a deck of cards
     *
     * @param array $cards Array of card data to sort
     * @return array Sorted cards
     */
    public function sort_deck(array $cards): array
    {
        if (empty($cards)) {
            return [];
        }

        // Convert from raw data to Card objects if needed
        $card_objects = array_map(
            function ($card) {
                return $card instanceof Card ? $card : new Card($card);
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

    /**
     * Import a deck list
     *
     * @param string $deck_list Raw deck list text
     * @return array Array containing cards and errors
     */
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

                if (!$card) {
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

    /**
     * Get card by set and collector number (most efficient)
     *
     * @param string $set Set code
     * @param string $number Collector number
     * @return Card|null
     */
    private function get_card_by_set_number(string $set, string $number): ?Card
    {
        // Check cache first
        $cached_data = $this->cache_service->get_card(null, $set, $number);
        if ($cached_data) {
            $this->log_cache_result('direct', $set, $number, true);
            return new Card($cached_data);
        }

        $this->log_cache_result('direct', $set, $number, false);

        // Fetch from Scryfall
        $scryfall_data = $this->scryfall_client->fetch_card('', $set, $number);
        if (!$scryfall_data) {
            return null;
        }

        // Cache the result
        $this->cache_service->store_card($scryfall_data);
        return new Card($scryfall_data);
    }

    /**
     * Get card by name and set
     *
     * @param string $name Card name
     * @param string $set Set code
     * @return Card|null
     */
    private function get_card_by_set_name(string $name, string $set): ?Card
    {
        // Fetch from Scryfall with set-specific search
        $scryfall_data = $this->scryfall_client->fetch_card($name, $set);
        if (!$scryfall_data) {
            return null;
        }

        // Check if this resolved card is in cache
        $cached_data = $this->cache_service->get_card(
            null,
            $scryfall_data['set'],
            $scryfall_data['collector_number']
        );

        // Log what we got back from Scryfall
        $this->log_scryfall_resolution(
            'set_name',
            $name,
            $set,
            $scryfall_data['set'],
            $scryfall_data['collector_number']
        );

        if ($cached_data) {
            $this->log_cache_result('resolved', $scryfall_data['set'], $scryfall_data['collector_number'], true);
            return new Card($cached_data);
        }

        $this->log_cache_result('resolved', $scryfall_data['set'], $scryfall_data['collector_number'], false);

        // Cache the result using set/number
        $this->cache_service->store_card($scryfall_data);
        return new Card($scryfall_data);
    }

    /**
     * Get card by name only
     *
     * @param string $name Card name
     * @return Card|null
     */
    private function get_card_by_name(string $name): ?Card
    {
        // Fetch from Scryfall
        $scryfall_data = $this->scryfall_client->fetch_card($name);
        if (!$scryfall_data) {
            return null;
        }

        // Check if this resolved card is in cache
        $cached_data = $this->cache_service->get_card(
            null,
            $scryfall_data['set'],
            $scryfall_data['collector_number']
        );

        // Log what we got back from Scryfall
        $this->log_scryfall_resolution(
            'name_only',
            $name,
            null,
            $scryfall_data['set'],
            $scryfall_data['collector_number']
        );

        if ($cached_data) {
            $this->log_cache_result('resolved', $scryfall_data['set'], $scryfall_data['collector_number'], true);
            return new Card($cached_data);
        }

        $this->log_cache_result('resolved', $scryfall_data['set'], $scryfall_data['collector_number'], false);

        // Cache the result using returned set/number
        $this->cache_service->store_card($scryfall_data);
        return new Card($scryfall_data);
    }

    /**
     * Parse a single line from a deck list
     *
     * @param string $line Raw deck list line
     * @return array Parsed card data
     * @throws \Exception If line format is invalid
     */
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

    /**
     * Log the initial search attempt
     *
     * @param string $name Card name
     * @param string|null $set Set code
     * @param string|null $number Collector number
     */
    private function log_search_attempt(string $name, ?string $set, ?string $number): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $search_type = $set && $number ? 'SET_NUMBER' : ($set && $name ? 'SET_NAME' : 'NAME_ONLY');
            error_log(sprintf(
                'MTG4WP Search Attempt [%s]: name="%s" set="%s" number="%s"',
                $search_type,
                $name,
                $set ?? 'null',
                $number ?? 'null'
            ));
        }
    }

    /**
     * Log cache hit/miss for direct lookups
     *
     * @param string $lookup_type Type of lookup performed
     * @param string $set Set code
     * @param string $number Collector number
     * @param bool $hit Whether cache was hit
     */
    private function log_cache_result(string $lookup_type, string $set, string $number, bool $hit): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'MTG4WP Cache %s [%s]: %s-%s',
                $hit ? 'HIT' : 'MISS',
                $lookup_type,
                $set,
                $number
            ));
        }
    }

    /**
     * Log what Scryfall resolved a search to
     *
     * @param string $search_type Type of search performed
     * @param string $search_term Search term used
     * @param string|null $search_set Set code used in search
     * @param string $resolved_set Resolved set code
     * @param string $resolved_number Resolved collector number
     */
    private function log_scryfall_resolution(
        string $search_type,
        string $search_term,
        ?string $search_set,
        string $resolved_set,
        string $resolved_number
    ): void {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'MTG4WP Scryfall Resolution [%s]: "%s" (%s) -> %s-%s',
                $search_type,
                $search_term,
                $search_set ?? 'no set',
                $resolved_set,
                $resolved_number
            ));
        }
    }

    /**
     * Log errors
     *
     * @param string $name Card name
     * @param string|null $set Set code
     * @param string|null $number Collector number
     * @param string $message Error message
     */
    private function log_error(string $name, ?string $set, ?string $number, string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'MTG4WP Error: name="%s" set="%s" number="%s" error="%s"',
                $name,
                $set ?? 'null',
                $number ?? 'null',
                $message
            ));
        }
    }
}