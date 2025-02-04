<?php

/**
 * Plugin Name: MTG4WP
 * Plugin URI: https://github.com/daneholmes/MTG4WP
 * Description: Display Magic: The Gathering© cards on WordPress
 * Version: 1.0.0
 * Author: Dane Holmes
 * Author URI: https://daneholmes.com
 * License: GPL-3.0-only
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: MTG4WP
 * Requires at least: 6.1
 * Requires PHP: 7.4
 */

namespace MTG4WP;

if (!defined('ABSPATH')) {
    exit;
}

// Constants
define('MTG4WP_VERSION', '1.0.0');
define('MTG4WP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MTG4WP_PLUGIN_URL', plugin_dir_url(__FILE__));

// Required files
require_once MTG4WP_PLUGIN_DIR . 'includes/models/class-card.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-cache-service.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-card-service.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-scryfall-client.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/api/class-rest-api.php';

// Initialize the plugin
function init()
{
    // Initialize services
    $cache_service = new Services\CacheService();
    $scryfall_client = new Services\ScryfallClient();
    $card_service = new Services\CardService($scryfall_client, $cache_service);
    new API\RestAPI($card_service);

    // Register block
    $block_json = MTG4WP_PLUGIN_DIR . 'build/block.json';
    if (file_exists($block_json)) {
        register_block_type($block_json);
    }
}
add_action('init', __NAMESPACE__ . '\init');

// Enqueue block editor assets
function enqueue_editor_assets()
{
    wp_enqueue_script(
        'mtg4wp-editor',
        MTG4WP_PLUGIN_URL . 'build/index.js',
        [
            'wp-blocks',
            'wp-i18n',
            'wp-element',
            'wp-block-editor',
            'wp-components'
        ],
        MTG4WP_VERSION
    );
}
add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_editor_assets');

// In MTG4WP.php

// Plugin activation hook
function activate()
{
    global $wp_version;
    if (version_compare($wp_version, '6.1', '<') || version_compare(PHP_VERSION, '7.4', '<')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(
            esc_html__('This plugin requires WordPress 6.1 or higher and PHP 7.4 or higher.', 'MTG4WP'),
            'Plugin Activation Error',
            ['response' => 200, 'back_link' => true]
        );
    }
    delete_expired_transients();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, __NAMESPACE__ . '\activate');

// Plugin deactivation hook
function deactivate()
{
    Services\CacheService::flush_all_caches();
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, __NAMESPACE__ . '\deactivate');

// Plugin upgrade hook
function handle_upgrade()
{
    $current_version = get_option('mtg4wp_version', '1.0.0');

    if (version_compare($current_version, MTG4WP_VERSION, '<')) {
        Services\CacheService::flush_all_caches();
        update_option('mtg4wp_version', MTG4WP_VERSION);
    }
}
add_action('plugins_loaded', __NAMESPACE__ . '\handle_upgrade');

// Load plugin text domain
function load_textdomain()
{
    load_plugin_textdomain('mtg4wp', false, dirname(plugin_basename(__FILE__)) . '/languages');
}
add_action('plugins_loaded', __NAMESPACE__ . '\load_textdomain');
