<?php
/**
 * Plugin Name:       Magic Cards and Decks
 * Plugin URI:        https://github.com/daneholmes/MTG-Tools
 * Description:       A plugin for displaying Magic: The Gathering cards on WordPress
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Dane Holmes
 * Author URI:        https://daneholmes.com
 * License:           GPL-3.0-only
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       mtg-tools
 *
 * @package magic-decks-and-cards
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function mtg_tools_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'mtg_tools_block_init' );

function mtg_tools_enqueue_assets() {

	wp_enqueue_style('dashicons');
	wp_enqueue_script('sweetalert2-js', plugins_url('assets/libraries/sweetalert2.min.js', __FILE__), array(), '11.0.0', true);
	wp_enqueue_style('mtg-tools-editor-styles', plugins_url( 'build/index.css', __FILE__ ), array( 'wp-edit-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'build/index.css' )
	);
	wp_enqueue_style('mtg-tools-style', plugins_url( 'build/style-index.css', __FILE__ ), array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'build/style-index.css' )
	);

}
add_action('wp_enqueue_scripts', 'mtg_tools_enqueue_assets');
add_action('enqueue_block_editor_assets', 'mtg_tools_enqueue_assets');
add_action('enqueue_block_assets', 'mtg_tools_enqueue_assets');
?>
