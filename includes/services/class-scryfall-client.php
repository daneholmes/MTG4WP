<?php

namespace MTG4WP\Services;

class ScryfallClient
{
    private const API_BASE_URL = 'https://api.scryfall.com';
    private const USER_AGENT = 'MTG4WP/2.0.0';
    private const RATE_LIMIT = [
        'requests_per_second' => 10,
        'burst_limit' => 100,
        'retry_after' => 100, // ms
    ];
    private const TRANSIENTS = [
        'tokens' => 'mtg4wp_rate_limit_tokens',
        'last_update' => 'mtg4wp_rate_limit_last_update',
    ];

    // Fetch a card from the Scryfall API
    public function fetch_card(string $card_name, ?string $set = null, ?string $number = null): ?array
    {
        $url = $this->build_api_url($card_name, $set, $number);
        if (!$url) {
            return null;
        }

        return $this->make_request($url);
    }

    // Initialize or refresh rate limit tokens
    private function init_rate_limit(): int
    {
        $tokens = get_transient(self::TRANSIENTS['tokens']);
        $last_update = get_transient(self::TRANSIENTS['last_update']);

        if (false === $tokens) {
            $tokens = self::RATE_LIMIT['burst_limit'];
        }

        if (false === $last_update) {
            $last_update = microtime(true);
        }

        $now = microtime(true);
        $elapsed = $now - $last_update;
        $new_tokens = min(
            self::RATE_LIMIT['burst_limit'],
            $tokens + ($elapsed * self::RATE_LIMIT['requests_per_second'])
        );

        set_transient(self::TRANSIENTS['tokens'], $new_tokens, HOUR_IN_SECONDS);
        set_transient(self::TRANSIENTS['last_update'], $now, HOUR_IN_SECONDS);

        return (int) $new_tokens;
    }

    // Consume a rate limit token
    private function consume_token(): bool
    {
        $tokens = $this->init_rate_limit();

        if ($tokens < 1) {
            return false;
        }

        set_transient(self::TRANSIENTS['tokens'], $tokens - 1, HOUR_IN_SECONDS);
        return true;
    }

    // Make an API request
    private function make_request(string $url, int $retries = 3): ?array
    {
        if (!$this->consume_token()) {
            if ($retries > 0) {
                usleep(self::RATE_LIMIT['retry_after'] * 1000);
                return $this->make_request($url, $retries - 1);
            }
            throw new \Exception(__('Rate limit exceeded. Please try again in a moment.', 'mtg4wp'));
        }

        $response = wp_remote_get(
            $url,
            [
                'timeout'     => 15,
                'user-agent'  => self::USER_AGENT,
                'sslverify'   => true,
            ]
        );

        if (is_wp_error($response)) {
            error_log('MTG4WP Scryfall API Error: ' . $response->get_error_message());
            return null;
        }

        $response_code = wp_remote_retrieve_response_code($response);

        // Handle rate limiting headers from Scryfall
        if (429 === $response_code && $retries > 0) {
            $retry_after = wp_remote_retrieve_header($response, 'retry-after');
            sleep((int) $retry_after ?: 1);
            return $this->make_request($url, $retries - 1);
        }

        if (200 !== $response_code) {
            error_log(sprintf('MTG4WP Scryfall API Error: HTTP %d for URL %s', $response_code, $url));
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!$this->validate_card_data($data)) {
            error_log(sprintf('MTG4WP Scryfall API Error: Invalid card data received for URL %s', $url));
            return null;
        }

        return $data;
    }

    // Build the URL based on search parameters
    private function build_api_url(string $card_name, ?string $set = null, ?string $number = null): ?string
    {
        if ($set && $number) {
            // Handle special characters in collector numbers
            $collector_number = str_replace(
                ['★', '†', '†††', '∆'],
                ['%E2%98%85', '%E2%80%A0', '%E2%80%A0%E2%80%A0%E2%80%A0', '%E2%88%86'],
                $number
            );

            return sprintf(
                '%s/cards/%s/%s',
                self::API_BASE_URL,
                urlencode(strtolower($set)),
                $collector_number // Already encoded special characters
            );
        }

        if ($card_name) {
            $query = ['fuzzy' => urlencode($card_name)];
            if ($set) {
                $query['set'] = urlencode(strtolower($set));
            }
            return add_query_arg($query, self::API_BASE_URL . '/cards/named');
        }

        return null;
    }

    // Validate card data from API response
    private function validate_card_data(?array $data): bool
    {
        if (!$data || !is_array($data)) {
            return false;
        }

        $required_fields = ['id', 'name', 'set', 'collector_number'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return false;
            }
        }

        return true;
    }
}
