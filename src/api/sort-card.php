<?php

namespace MTG4WP\api;

class Sort_Card {
    private $section_order = [
        'commander' => 0,
        'mainboard' => 1,
        'sideboard' => 2,
        'maybeboard' => 3,
        'token' => 4
    ];

    private $type_order = [
        'creature' => 0,
        'planeswalker' => 1,
        'artifact' => 2,
        'battle' => 3,
        'enchantment' => 4,
        'instant' => 5,
        'sorcery' => 6,
        'land' => 7
    ];

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_endpoints']);
    }

    public function register_endpoints() {
        register_rest_route('wp/v2/mtg4wp', '/sort', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_sort_request'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'cards' => [
                    'required' => true,
                    'type' => 'array',
                ],
            ],
        ]);
    }

    public function handle_sort_request($request) {
        try {
            $cards = $request->get_param('cards');

            if (empty($cards)) {
                return $this->error_response('No cards provided.', 400);
            }

            // Log the incoming data for debugging
            error_log('MTG4WP Sort Request - Cards: ' . print_r($cards, true));

            $sorted_cards = $this->sort_cards_by_section($cards);
            return new \WP_REST_Response($sorted_cards, 200);
        } catch (\Exception $e) {
            error_log('MTG4WP Sort Error: ' . $e->getMessage());
            return $this->error_response('Error sorting cards: ' . $e->getMessage(), 500);
        }
    }

    private function sort_cards_by_section($cards) {
        // Group cards by section
        $sections = [];
        foreach ($cards as $card) {
            $section = $card['section'] ?? 'mainboard';
            if (!isset($sections[$section])) {
                $sections[$section] = [];
            }
            $sections[$section][] = $card;
        }

        // Sort each section according to its rules
        foreach ($sections as $section => &$section_cards) {
            if ($section === 'commander') {
                usort($section_cards, [$this, 'compare_commander_cards']);
            } else {
                usort($section_cards, [$this, 'compare_regular_cards']);
            }
        }

        // Combine sections in the correct order
        $result = [];
        foreach ($this->section_order as $section => $order) {
            if (isset($sections[$section])) {
                $result = array_merge($result, $sections[$section]);
            }
        }

        return $result;
    }

    private function compare_commander_cards($a, $b) {
        // Get types from the front face
        $a_type = $this->get_primary_type($this->get_card_type_line($a));
        $b_type = $this->get_primary_type($this->get_card_type_line($b));
        
        // Creatures go first
        $a_is_creature = $a_type === 'creature';
        $b_is_creature = $b_type === 'creature';
        
        if ($a_is_creature !== $b_is_creature) {
            return $b_is_creature - $a_is_creature;
        }

        // Then sort by CMC
        $a_cmc = $this->get_cmc($a);
        $b_cmc = $this->get_cmc($b);
        if ($a_cmc !== $b_cmc) {
            return $a_cmc - $b_cmc;
        }

        // Finally sort alphabetically
        return strcmp($a['name'], $b['name']);
    }

    private function compare_regular_cards($a, $b) {
        // Get types from the front face
        $a_type = $this->get_primary_type($this->get_card_type_line($a));
        $b_type = $this->get_primary_type($this->get_card_type_line($b));
        
        // Compare type order
        $a_type_order = $this->type_order[$a_type] ?? 999;
        $b_type_order = $this->type_order[$b_type] ?? 999;
        if ($a_type_order !== $b_type_order) {
            return $a_type_order - $b_type_order;
        }

        // Sort by CMC
        $a_cmc = $this->get_cmc($a);
        $b_cmc = $this->get_cmc($b);
        if ($a_cmc !== $b_cmc) {
            return $a_cmc - $b_cmc;
        }

        // Sort alphabetically
        return strcmp($a['name'], $b['name']);
    }

    private function get_card_type_line($card) {
        return $card['faces'][0]['type_line'] ?? $card['type_line'] ?? '';
    }

    private function get_primary_type($type_line) {
        if (empty($type_line)) {
            return 'artifact'; // Default if no type line is found
        }

        // Convert to lowercase for consistent comparison
        $type_line = strtolower($type_line);
        
        // Remove any "legendary", "basic", etc.
        $type_line = preg_replace('/^(legendary|basic|snow|world|token)\s+/i', '', $type_line);
        
        // Split into individual types
        $types = preg_split('/\s+/', $type_line);
        
        // Priority types
        if (in_array('creature', $types)) {
            return 'creature';
        }
        if (in_array('planeswalker', $types)) {
            return 'planeswalker';
        }
        
        // For other cards, find the first recognized type
        foreach ($types as $type) {
            if (isset($this->type_order[$type])) {
                return $type;
            }
        }
        
        // Default to artifact if no recognized type is found
        return 'artifact';
    }

    private function get_cmc($card) {
        $cmc = $card['cmc'] ?? 0;
        
        // Calculate CMC from mana_cost
        if (!$cmc && isset($card['faces'][0]['mana_cost'])) {
            $mana_cost = $card['faces'][0]['mana_cost'];
            preg_match_all('/\{([^}]+)\}/', $mana_cost, $matches);
            
            if (!empty($matches[1])) {
                $cmc = array_reduce($matches[1], function($total, $symbol) {
                    if ($symbol === 'X') return $total;
                    return $total + (is_numeric($symbol) ? intval($symbol) : 1);
                }, 0);
            }
        }

        error_log("Card: {$card['name']}, CMC: $cmc, Mana Cost: " . ($card['faces'][0]['mana_cost'] ?? 'none'));
        return $cmc;
    }

    private function error_response($message, $status_code) {
        return new \WP_Error('sort_error', $message, ['status' => $status_code]);
    }

    public function check_permissions() {
        return current_user_can('edit_posts');
    }
}