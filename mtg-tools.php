<?php
/**
 * Plugin Name:       MTG Tools
 * Plugin URI:        https://github.com/daneholmes/MTG-Tools
 * Description:       A plugin for displaying Magic: The Gathering cards on WordPress
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.9.0
 * Author:            Dane Holmes
 * Author URI:        https://daneholmes.com
 * License:           GPL-3.0-only
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       mtg-tools
 *
 * @package MtgTools
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
	wp_enqueue_style('sweetalert2-css', 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css', array(), null);
	wp_enqueue_script('sweetalert2-js', 'https://cdn.jsdelivr.net/npm/sweetalert2@11', array(),	null, true);
}
add_action('wp_enqueue_scripts', 'mtg_tools_enqueue_assets');
?>
