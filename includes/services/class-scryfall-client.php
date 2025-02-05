<?php

namespace mtg4wp\Services;

class ScryfallClient {
    private const API_BASE_URL = 'https://api.scryfall.com';
    private const CACHE_GROUP = 'mtg4wp_cards';
    private const CACHE_TTL = WEEK_IN_SECONDS;
    private const RATE_LIMIT = [
        'requests_per_second' => 10,
        'burst_limit' => 100,
        'retry_after' => 100,
    ];

    // Fetches card data by Scryfall ID
    public function get_card(string $id): ?array {
        // Try cache first
        $cached = wp_cache_get($id, self::CACHE_GROUP);
        if (false !== $cached) {
            return $cached;
        }

        // Fetch from API
        $data = $this->fetch_from_api("/cards/$id");
        if ($data) {
            wp_cache_set($id, $data, self::CACHE_GROUP, self::CACHE_TTL);
        }

        return $data;
    }

    // Looks up a card by name and optional set
    public function get_card_by_name(string $name, ?string $set = null): ?array {
        $params = ['fuzzy' => $name];
        if ($set) {
            $params['set'] = $set;
        }

        $data = $this->fetch_from_api('/cards/named', $params);
        if ($data) {
            wp_cache_set($data['id'], $data, self::CACHE_GROUP, self::CACHE_TTL);
        }

        return $data;
    }

    // Makes an API request with rate limiting
    private function fetch_from_api(string $endpoint, array $params = []): ?array {
        if (!$this->check_rate_limit()) {
            return null;
        }

        $url = self::API_BASE_URL . $endpoint;
        if ($params) {
            $url = add_query_arg($params, $url);
        }

        $response = wp_remote_get($url, [
            'timeout' => 15,
            'headers' => [
                'User-Agent' => 'MTG4WP/1.0.0',
            ],
        ]);

        if (is_wp_error($response)) {
            $this->log_error($endpoint, $response->get_error_message());
            return null;
        }

        $code = wp_remote_retrieve_response_code($response);
        if (200 !== $code) {
            $this->log_error($endpoint, "HTTP $code");
            return null;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$this->validate_card_data($data)) {
            $this->log_error($endpoint, 'Invalid card data');
            return null;
        }

        return $data;
    }

    // Validates card data structure
    private function validate_card_data($data): bool {
        return is_array($data) && 
               isset($data['id'], $data['name']) &&
               !empty($data['id']) &&
               !empty($data['name']);
    }

    // Checks and updates rate limiting
    private function check_rate_limit(): bool {
        static $last_check = 0;
        static $remaining = self::RATE_LIMIT['burst_limit'];

        $now = microtime(true);
        $elapsed = $now - $last_check;

        if ($elapsed >= 1) {
            $remaining = self::RATE_LIMIT['burst_limit'];
        } else {
            $remaining += $elapsed * self::RATE_LIMIT['requests_per_second'];
            if ($remaining > self::RATE_LIMIT['burst_limit']) {
                $remaining = self::RATE_LIMIT['burst_limit'];
            }
        }

        $last_check = $now;

        if ($remaining < 1) {
            return false;
        }

        $remaining--;
        return true;
    }

    // Logs errors when WP_DEBUG is enabled
    private function log_error(string $endpoint, string $message): void {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'l4m4w Scryfall API Error: %s - Endpoint: %s',
                $message,
                $endpoint
            ));
        }
    }
}
