<?php

namespace MTG4WP;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles plugin lifecycle events like activation, deactivation, and upgrades.
 *
 * @since 1.0.0
 */
class PluginLifecycle
{
    /**
     * Plugin activation handler.
     *
     * @since 1.0.0
     * @return void
     */
    public static function activate()
    {
        global $wp_version;

        if (version_compare($wp_version, '6.1', '<') || version_compare(PHP_VERSION, '7.4', '<')) {
            deactivate_plugins(plugin_basename(MTG4WP_PLUGIN_FILE));
            wp_die(
                esc_html__('This plugin requires WordPress 6.1 or higher and PHP 7.4 or higher.', 'MTG4WP'),
                'Plugin Activation Error',
                ['response' => 200, 'back_link' => true]
            );
        }

        delete_expired_transients();
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation handler.
     *
     * @since 1.0.0
     * @return void
     */
    public static function deactivate()
    {
        Services\CacheService::flush_all_caches();
        flush_rewrite_rules();
    }

    /**
     * Plugin upgrade handler.
     *
     * @since 1.0.0
     * @return void
     */
    public static function handle_upgrade()
    {
        $current_version = get_option('mtg4wp_version', '1.0.0');

        if (version_compare($current_version, MTG4WP_VERSION, '<')) {
            Services\CacheService::flush_all_caches();
            update_option('mtg4wp_version', MTG4WP_VERSION);
        }
    }
}
