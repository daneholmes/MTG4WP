<?php
/**
 * Plugin Name:       MTG4WP
 * Plugin URI:        https://github.com/daneholmes/MTG4WP
 * Description:       Display Magic: The Gathering© cards on WordPress
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           2.0.0
 * Author:            Dane Holmes
 * Author URI:        https://daneholmes.com
 * License:           GPL-3.0-only
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       mtg4wp
 */

defined('ABSPATH') || exit;
 
define('MTG4WP_PATH', plugin_dir_path(__FILE__));
 
require_once MTG4WP_PATH . 'src/api/return-card.php';
require_once MTG4WP_PATH . 'src/api/scryfall-api.php';
require_once MTG4WP_PATH . 'src/api/fetch-card.php';
require_once MTG4WP_PATH . 'src/api/sort-card.php';

// Register activation hooks
register_activation_hook(__FILE__, function() {
    $return_card = new \MTG4WP\api\Return_Card();
    $return_card->initialize_table();
});

// Initialize API endpoints
new \MTG4WP\api\Fetch_Card();
new \MTG4WP\api\Sort_Card();

// Register block
add_action('init', fn() => register_block_type(__DIR__ . '/build'));