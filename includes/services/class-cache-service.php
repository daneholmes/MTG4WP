<?php

namespace MTG4WP\Services;

// Cache service for MTG cards following WordPress standards
class CacheService
{
    private const VERSION = '2.0.0';
    private const CACHE_GROUP = 'mtg4wp';

    // Get a card from cache
    public function get_card(?string $name, ?string $set = null, ?string $number = null): ?array
    {
        if (!$set || !$number) {
            return null;
        }
        $cache_key = $this->get_cache_key($set, $number);
        // Try object cache first
        $data = wp_cache_get($cache_key, self::CACHE_GROUP);
        // Fall back to transient if not in object cache
        if (false === $data) {
            $data = get_transient(self::CACHE_GROUP . '_' . $cache_key);
            // If found in transient, store in object cache
            if (false !== $data) {
                wp_cache_set($cache_key, $data, self::CACHE_GROUP);
            }
        }
        return $data === false ? null : $data;
    }

    //Store a card in cache
    public function store_card(array $card_data): bool
    {
        if (empty($card_data['set']) || empty($card_data['collector_number'])) {
            return false;
        }

        $cache_key = $this->get_cache_key(
            $card_data['set'],
            $card_data['collector_number']
        );

        $ttl = (int) apply_filters('mtg4wp_cache_ttl', DAY_IN_SECONDS);

        // Store in both object cache and transient
        wp_cache_set($cache_key, $card_data, self::CACHE_GROUP, $ttl);
        return set_transient(self::CACHE_GROUP . '_' . $cache_key, $card_data, $ttl);
    }

    // Delete a card from cache
    public function delete_card_cache(?string $name, ?string $set = null, ?string $number = null): bool
    {
        if (!$set || !$number) {
            return false;
        }

        $cache_key = $this->get_cache_key($set, $number);
        wp_cache_delete($cache_key, self::CACHE_GROUP);
        return delete_transient(self::CACHE_GROUP . '_' . $cache_key);
    }

    // Clear all plugin caches
    public function clear_all_caches(): bool
    {
        delete_transient('mtg4wp_cache_key');
        do_action('mtg4wp_clear_cache');

        return true;
    }

    public static function flush_all_caches(): void
    {
        delete_transient('mtg4wp_cache_key');
    }

    // Get standardized cache key
    private function get_cache_key(string $set, string $number): string
    {
        return sprintf(
            '%s_%s',
            sanitize_key(strtolower(trim($set))),
            sanitize_key(strtolower(trim($number)))
        );
    }
}
