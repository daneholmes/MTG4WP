<?php

namespace MTG4WP\api;

use MTG4WP\api\Return_Card;

class Fetch_Card {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_endpoints']);
    }

    public function register_endpoints() {
        register_rest_route('wp/v2/mtg4wp', '/search', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_search_request'],
            'permission_callback' => [$this, 'check_permissions'],
            'args'                => [
                'card_name' => [
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'set' => [
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'number' => [
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    public function handle_search_request($request) {
        $card_name = $request->get_param('card_name');
        $set = $request->get_param('set');
        $number = $request->get_param('number');
        
        if (!$this->validate_search_params($card_name, $set, $number)) {
            return new \WP_Error(
                'invalid_parameters',
                __('Please provide either a card name or both set code and collector number.', 'mtg4wp'),
                ['status' => 400]
            );
        }
    
        $return_card = new Return_Card();
        $card_data = $return_card->fetch_card($card_name, $set, $number);
    
        if (!$card_data) {
            return new \WP_Error(
                'card_not_found',
                __('No card found with the provided parameters.', 'mtg4wp'),
                ['status' => 404]
            );
        }
    
        return new \WP_REST_Response($card_data, 200);
    }
    
    private function validate_search_params($card_name, $set, $number) {
        return (
            (!empty($card_name) && empty($set) && empty($number)) || // Just card name
            (!empty($set) && !empty($number)) || // Set and number
            (!empty($card_name) && !empty($set)) // Card name and set
        );
    }

    public function check_permissions() {
        return current_user_can('edit_posts');
    }
}