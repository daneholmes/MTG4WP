<?php

namespace MTG4WP\api;

class Scryfall_API {
    private $requests_per_second = 10;

    public function fetch_from_api($card_name, $set = null, $number = null) {
        if (!$this->rate_limit()) {
            wp_die(__('Rate limit exceeded. Try again.', 'mtg4wp'));
        }

        $url = $this->build_api_url($card_name, $set, $number);
        $response = wp_remote_get($url, [
            'timeout' => 15,
            'headers' => ['User-Agent' => 'MTG4WP/1.0']
        ]);

        if (is_wp_error($response)) {
            error_log('MTG4WP Error: ' . $response->get_error_message() . ' for URL: ' . $url);
            return null;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$data || isset($data['error'])) {
            error_log('Scryfall API Invalid Response: ' . wp_remote_retrieve_body($response) . ' for URL: ' . $url);
            return null;
        }

        return $data;
    }

    private function rate_limit() {
        $key = 'mtg4wp_rate_limit';
        $requests = get_transient($key) ?: 0;

        if ($requests >= $this->requests_per_second) {
            return false;
        }

        set_transient($key, $requests + 1, 1);
        return true;
    }

    private function build_api_url($card_name, $set, $number) {
        if ($set && $number) {
            return "https://api.scryfall.com/cards/" . urlencode($set) . "/" . urlencode($number);
        }
        if ($card_name) {
            $query = ['fuzzy' => urlencode($card_name)];
            if ($set) {
                $query['set'] = urlencode($set);
            }
            return add_query_arg($query, 'https://api.scryfall.com/cards/named');
        }
        error_log('Could not find card on Scryfall. Try again.');
        return null;
    }
}