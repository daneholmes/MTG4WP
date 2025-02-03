<?php

namespace MTG4WP\API;

use MTG4WP\Services\CardService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_REST_Server;

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
        // Card search endpoint with schema
        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'card',
            'type'       => 'object',
            'properties' => [
                'name'   => [
                    'description' => __('The name of the card to search for', 'mtg4wp'),
                    'type'       => 'string',
                ],
                'set'    => [
                    'description' => __('The three-letter set code', 'mtg4wp'),
                    'type'       => 'string',
                    'pattern'    => '^[a-zA-Z0-9]{3,}$',
                ],
                'number' => [
                    'description' => __('The collector number', 'mtg4wp'),
                    'type'       => 'string',
                ],
            ],
        ];

        register_rest_route(
            self::API_NAMESPACE,
            '/cards',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'get_card'],
                    'permission_callback' => [$this, 'check_permissions'],
                    'args'               => [
                        'name'   => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => function ($param, $request) {
                                // If name is provided, it must not be empty
                                if ($param !== null && empty(trim($param))) {
                                    return false;
                                }
                                // If name is not provided, both set and number must be present
                                if ($param === null) {
                                    return !empty($request->get_param('set')) &&
                                           !empty($request->get_param('number'));
                                }
                                return true;
                            },
                            'description'       => __('Search for a card by name.', 'mtg4wp'),
                        ],
                        'set'    => [
                            'required'          => false,
                            'type'             => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => function ($param) {
                                return $param === null || !empty(trim($param));
                            },
                            'description'       => __('Set code (e.g., "MID" for Midnight Hunt).', 'mtg4wp'),
                        ],
                        'number' => [
                            'required'          => false,
                            'type'             => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => function ($param) {
                                return $param === null || !empty(trim($param));
                            },
                            'description'       => __('Collector number of the card.', 'mtg4wp'),
                        ],
                    ],
                    'schema'             => $schema,
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
                        'required'    => true,
                        'type'        => 'array',
                        'description' => __('Array of card objects to sort.', 'mtg4wp'),
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
    public function get_card(WP_REST_Request $request)
    {
        try {
            $name   = $request->get_param('name');
            $set    = $request->get_param('set');
            $number = $request->get_param('number');

            // The validation in register_routes ensures having either:
            // 1. A non-empty name (with optional set), or
            // 2. Both set and number
            $card = $this->card_service->get_card($name ?? '', $set, $number);
            if (!$card) {
                return new WP_Error(
                    'card_not_found',
                    __('No card found with the provided parameters.', 'mtg4wp'),
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

    // Handle deck sort requests
    public function sort_deck(WP_REST_Request $request)
    {
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
    public function import_deck(WP_REST_Request $request)
    {
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
