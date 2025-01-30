<?php

namespace MTG4WP\api;

class Return_Card {
    private $wpdb;
    private $table_name;
    private $cache_version = '1.0';
    private $cache_ttl = DAY_IN_SECONDS;
    private $scryfall_api;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $wpdb->prefix . 'MTG4WP';
        $this->scryfall_api = new Scryfall_API();
        add_action('init', [$this, 'initialize_table']);
    }

    public function initialize_table() {
        if ($this->wpdb->get_var($this->wpdb->prepare("SHOW TABLES LIKE %s", $this->table_name)) !== $this->table_name) {
            $sql = "CREATE TABLE $this->table_name (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                PRIMARY KEY (id),
                card_id text NOT NULL,
                name text NOT NULL,
                set_code text,
                collector_number text,
                data longtext NOT NULL,
                cache_version varchar(10) NOT NULL,
                last_updated datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )";
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
    }

    public function fetch_card($card_name, $set = null, $number = null) {
        $cached_card = $this->get_cached_card($card_name, $set, $number);

        if ($cached_card && $this->is_cache_valid($cached_card->last_updated)) {
            $card_data = json_decode($cached_card->data, true);
            return $this->transform_card_data($card_data);
        }

        $card_data = $this->scryfall_api->fetch_from_api($card_name, $set, $number);
        if ($card_data) {
            $this->store_in_cache($card_data, $set, $number);
            return $this->transform_card_data($card_data);
        }

        return null;
    }

    private function transform_card_data($card_data) {
        $transformed = [
            'id' => $card_data['id'],
            'name' => $card_data['name'],
            'set' => $card_data['set'],
            'collector_number' => $card_data['collector_number'],
            'rarity' => $card_data['rarity'],
            'layout' => $card_data['layout'],
            'isDoubleFaced' => false,
            // Default values for editor
            'quantity' => 1,
            'foil' => false,
            'section' => 'mainboard',
            'currentFace' => 0,
            'faces' => []
        ];

        // Handle different card layouts
        switch ($card_data['layout']) {
            case 'transform':
            case 'modal_dfc':
            case 'double_faced_token':
                $transformed['isDoubleFaced'] = true;
                $transformed['faces'] = $this->extract_card_faces($card_data);
                break;
                
            case 'split':
            case 'flip':
            case 'adventure':
                $transformed['faces'] = [
                    $this->create_face_data($card_data)
                ];
                break;
                
            default:
                $transformed['faces'] = [
                    $this->create_face_data($card_data)
                ];
        }

        return $transformed;
    }

    private function extract_card_faces($card_data) {
        $faces = [];
        
        if (isset($card_data['card_faces']) && is_array($card_data['card_faces'])) {
            foreach ($card_data['card_faces'] as $face) {
                $faces[] = [
                    'name' => $face['name'],
                    'type_line' => $face['type_line'] ?? '',
                    'oracle_text' => $face['oracle_text'] ?? '',
                    'image' => $face['image_uris']['normal'] ?? null,
                    'mana_cost' => $face['mana_cost'] ?? '',
                ];
            }
        }
        
        return $faces;
    }

    private function create_face_data($card_data) {
        return [
            'name' => $card_data['name'],
            'type_line' => $card_data['type_line'] ?? '',
            'oracle_text' => $card_data['oracle_text'] ?? '',
            'image' => $card_data['image_uris']['normal'] ?? null,
            'mana_cost' => $card_data['mana_cost'] ?? '',
        ];
    }

    private function is_cache_valid($last_updated) {
        return (time() - strtotime($last_updated)) < $this->cache_ttl;
    }

    private function get_cached_card($card_name, $set, $number) {
        return $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM $this->table_name 
            WHERE name = %s AND cache_version = %s
            AND (set_code = %s OR %s IS NULL)
            AND (collector_number = %s OR %s IS NULL)",
            $card_name, $this->cache_version, $set, $set, $number, $number
        ));
    }

    private function store_in_cache($card_data, $set, $number) {
        $this->wpdb->replace(
            $this->table_name,
            [
                'card_id' => $card_data['id'],
                'name' => $card_data['name'],
                'set_code' => $set ?? $card_data['set'],
                'collector_number' => $number ?? $card_data['collector_number'],
                'data' => json_encode($card_data),
                'cache_version' => $this->cache_version,
                'last_updated' => current_time('mysql')
            ]
        );
    }
}