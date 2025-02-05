<?php

namespace mtg4wp\API;

use mtg4wp\Services\CardService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_REST_Server;

// REST API handler for MTG4WP
class RestAPI
{
    private const API_NAMESPACE = 'mtg4wp/v1';
    private $card_service;

    public function __construct(CardService $card_service)
    {
        $this->card_service = $card_service;
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    // Register REST API routes
    public function register_routes(): void
    {
        // General card search endpoint - handles name, set/number, or both
        register_rest_route(
            self::API_NAMESPACE,
            '/cards',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'search_card'],
                    'permission_callback' => [$this, 'check_permissions'],
                    'args'               => [
                        'name'   => [
                            'required'          => false,
                            'type'             => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => __('Card name to search for.', 'mtg4wp'),
                        ],
                        'set'    => [
                            'required'          => false,
                            'type'             => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => function ($param) {
                                return empty($param) || preg_match('/^[a-zA-Z0-9]{3,}$/', $param);
                            },
                            'description'       => __('Set code.', 'mtg4wp'),
                        ],
                        'number' => [
                            'required'          => false,
                            'type'             => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => __('Collector number.', 'mtg4wp'),
                        ],
                    ],
                ],
            ]
        );

        // Card by ID endpoint
        register_rest_route(
            self::API_NAMESPACE,
            '/cards/(?P<id>[a-f0-9-]+)',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'get_card_by_id'],
                    'permission_callback' => [$this, 'check_permissions'],
                    'args'               => [
                        'id' => [
                            'required'          => true,
                            'type'             => 'string',
                            'validate_callback' => function ($param) {
                                return preg_match('/^[a-f0-9-]+$/', $param);
                            },
                            'description'       => __('Scryfall ID of the card.', 'mtg4wp'),
                        ],
                    ],
                ],
            ]
        );

        // Deck sort endpoint
        register_rest_route(
            self::API_NAMESPACE,
            '/deck/sort',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'sort_deck'],
                'permission_callback' => [$this, 'check_permissions'],
                'args'               => [
                    'cards' => [
                        'required'          => true,
                        'type'             => 'array',
                        'description'       => __('Array of card objects to sort.', 'mtg4wp'),
                    ],
                ],
            ]
        );

        // Deck import endpoint
        register_rest_route(
            self::API_NAMESPACE,
            '/deck/import',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'import_deck'],
                'permission_callback' => [$this, 'check_permissions'],
                'args'               => [
                    'deck_list' => [
                        'required'          => true,
                        'type'             => 'string',
                        'sanitize_callback' => 'sanitize_textarea_field',
                        'description'       => __('Raw deck list text to import.', 'mtg4wp'),
                    ],
                ],
            ]
        );
    }

    // Handle card search requests
    public function search_card(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $name = $request->get_param('name');
            $set = $request->get_param('set');
            $number = $request->get_param('number');

            // Handle set/number lookup
            if ($set && $number) {
                $card = $this->card_service->get_card_by_set_number($set, $number);
                if (!$card) {
                    return new WP_Error(
                        'card_not_found',
                        __('No card found with the provided set and collector number.', 'mtg4wp'),
                        ['status' => 404]
                    );
                }
                return new WP_REST_Response($card->to_block_format(), 200);
            }

            // Handle name-based lookup
            if ($name) {
                $card = $this->card_service->get_card_by_name($name, $set);
                if (!$card) {
                    return new WP_Error(
                        'card_not_found',
                        __('No card found matching the search criteria.', 'mtg4wp'),
                        ['status' => 404]
                    );
                }
                return new WP_REST_Response($card->to_block_format(), 200);
            }

            return new WP_Error(
                'invalid_parameters',
                __('Must provide either card name or set and collector number.', 'mtg4wp'),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'server_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    // Handle card lookup by ID
    public function get_card_by_id(WP_REST_Request $request): WP_REST_Response|WP_Error {
        try {
            $id = $request->get_param('id');
            $card = $this->card_service->get_card_by_id($id);

            if (!$card) {
                return new WP_Error(
                    'card_not_found',
                    __('No card found with the provided ID.', 'mtg4wp'),
                    ['status' => 404]
                );
            }

            return new WP_REST_Response($card->to_block_format(), 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'server_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    // Handle deck sorting requests
    public function sort_deck(WP_REST_Request $request): WP_REST_Response|WP_Error {
        try {
            $cards = $request->get_param('cards');
            if (empty($cards)) {
                return new WP_Error(
                    'invalid_parameters',
                    __('No cards provided to sort.', 'mtg4wp'),
                    ['status' => 400]
                );
            }

            $sorted_cards = $this->card_service->sort_deck($cards);
            return new WP_REST_Response($sorted_cards, 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'server_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    // Handle deck import requests
    public function import_deck(WP_REST_Request $request): WP_REST_Response|WP_Error {
        try {
            $deck_list = $request->get_param('deck_list');
            $result = $this->card_service->import_deck($deck_list);

            if (empty($result['cards']) && !empty($result['errors'])) {
                return new WP_Error(
                    'import_failed',
                    __('Failed to import deck list.', 'mtg4wp'),
                    [
                        'status' => 400,
                        'errors' => $result['errors'],
                    ]
                );
            }

            return new WP_REST_Response(
                [
                    'cards'  => array_map(
                        function ($card) {
                            return $card->to_block_format();
                        },
                        $result['cards']
                    ),
                    'errors' => $result['errors'],
                ],
                200
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'server_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    // Check permissions for API requests
    public function check_permissions(): bool
    {
        return current_user_can('edit_posts');
    }
}
