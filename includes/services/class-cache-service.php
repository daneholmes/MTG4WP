<?php

namespace MTG4WP\Services;

class CacheService
{
    private const VERSION = '1.0.0';
    private const CACHE_GROUP = 'mtg4wp';

    /**
     * Get a card from cache
     *
     * @param string|null $name Card name (unused but kept for interface consistency)
     * @param string|null $set Set code
     * @param string|null $number Collector number
     * @return array|null
     */
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

    /**
     * Store a card in cache
     *
     * @param array $card_data Card data to cache
     * @return bool
     */
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

    /**
     * Delete a specific card from cache
     *
     * @param string|null $name Card name (unused but kept for interface consistency)
     * @param string|null $set Set code
     * @param string|null $number Collector number
     * @return bool
     */
    public function delete_card_cache(?string $name, ?string $set = null, ?string $number = null): bool
    {
        if (!$set || !$number) {
            return false;
        }

        $cache_key = $this->get_cache_key($set, $number);
        wp_cache_delete($cache_key, self::CACHE_GROUP);
        return delete_transient(self::CACHE_GROUP . '_' . $cache_key);
    }

    /**
     * Clear all plugin caches
     *
     * @return bool
     */
    public function clear_all_caches(): bool
    {
        global $wpdb;

        // Clear object cache group
        if (wp_using_ext_object_cache()) {
            // Force Redis to persist the deletion
            wp_cache_flush_runtime();
            wp_cache_flush_group(self::CACHE_GROUP);

            // If using Redis, ensure changes are persisted
            if (defined('WP_REDIS_OBJECT_CACHE') && WP_REDIS_OBJECT_CACHE) {
                global $wp_object_cache;
                if (method_exists($wp_object_cache, 'redis_instance')) {
                    $wp_object_cache->redis_instance()->save();
                }
            }
        }

        // Clear all plugin transients
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                $wpdb->esc_like('_transient_' . self::CACHE_GROUP) . '%',
                $wpdb->esc_like('_transient_timeout_' . self::CACHE_GROUP) . '%'
            )
        );

        // Additional cleanup for rate limiting transients
        delete_transient('mtg4wp_rate_limit_tokens');
        delete_transient('mtg4wp_rate_limit_last_update');
        delete_transient('mtg4wp_cache_key');

        do_action('mtg4wp_clear_cache');

        return true;
    }

    /**
     * Static method for cache flushing during plugin lifecycle events
     */
    public static function flush_all_caches(): void
    {
        $instance = new self();
        $instance->clear_all_caches();
    }

    /**
     * Get standardized cache key
     *
     * @param string $set Set code
     * @param string $number Collector number
     * @return string
     */
    private function get_cache_key(string $set, string $number): string
    {
        return sprintf(
            '%s_%s',
            sanitize_key(strtolower(trim($set))),
            sanitize_key(strtolower(trim($number)))
        );
    }
}
