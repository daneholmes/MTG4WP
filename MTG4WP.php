<?php

/**
 * Plugin Name: mtg4wp
 * Plugin URI: https://github.com/daneholmes/mtg4wp
 * Description: Seamlessly display Magic: The Gathering© cards on your WordPress website.
 * Version: 1.0.0
 * Author: Dane Holmes
 * Author URI: https://daneholmes.com
 * License: GPL-3.0-only
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: mtg4wp
 * Requires at least: 6.1
 * Requires PHP: 7.4
 */

namespace mtg4wp;

if (!defined('ABSPATH')) {
    exit;
}

// Constants
define('MTG4WP_VERSION', '1.0.0');
define('MTG4WP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MTG4WP_PLUGIN_URL', plugin_dir_url(__FILE__));

// Required files
require_once MTG4WP_PLUGIN_DIR . 'includes/models/class-card.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-card-service.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-scryfall-client.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/api/class-rest-api.php';
require_once MTG4WP_PLUGIN_DIR . 'includes/services/class-plugin-lifecycle.php';

// Initialize the plugin
function init()
{
    // Initialize services
    $scryfall_client = new Services\ScryfallClient();
    $card_service = new Services\CardService($scryfall_client);
    new API\RestAPI($card_service);

    // Register block
    $block_json = MTG4WP_PLUGIN_DIR . 'build/block.json';
    register_block_type($block_json);
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
            'wp-block-editor',
            'wp-components',
            'wp-element',
            'wp-icons',
            'wp-i18n'
        ],
        MTG4WP_VERSION
    );
}
add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_editor_assets');
