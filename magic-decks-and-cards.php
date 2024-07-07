<?php
/**
 * Plugin Name:       Magic Decks and Cards
 * Plugin URI:        https://github.com/daneholmes/Magic-Decks-and-Cards
 * Description:       A plugin for displaying Magic: The Gathering© cards on WordPress
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Dane Holmes
 * Author URI:        https://daneholmes.com
 * License:           GPL-3.0-only
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       mtg-decks-and-cards
 *
 * @package magic-decks-and-cards
 */

if (!defined('ABSPATH')) {
	exit;
}

function mtg_tools_block_init() {
	register_block_type(__DIR__ . '/build');
}
add_action('init', 'mtg_tools_block_init');

/* Frontend Styles */
function mtg_tools_enqueue_block_assets() {
	wp_enqueue_style(
		'mtg-tools-style',
		plugins_url('build/style-index.css', __FILE__),
		array(),
		filemtime(plugin_dir_path(__FILE__) . 'build/style-index.css')
	);
	wp_enqueue_style('dashicons');
	wp_enqueue_script('popper-js', 'https://unpkg.com/@popperjs/core@2', array(), null, true);
	wp_enqueue_script('tippy-js', 'https://unpkg.com/tippy.js@6', array('popper-js'), null, true);
	wp_enqueue_script('tooltips-js', plugin_dir_url(__FILE__) . 'src/tooltips.js', array('tippy-js'), null, true);
}
add_action('wp_enqueue_scripts', 'mtg_tools_enqueue_block_assets');

/* Backend Styles */
function mtg_tools_enqueue_block_editor_assets() {
	wp_enqueue_style(
		'mtg-tools-editor-styles',
		plugins_url('build/index.css', __FILE__),
		array('wp-edit-blocks'),
		filemtime(plugin_dir_path(__FILE__) . 'build/index.css')
	);
}
add_action('enqueue_block_editor_assets', 'mtg_tools_enqueue_block_editor_assets');

/* Add shortcode: [mtg_card name="Adeline, Resplendent Cathar" set="mid" number="1"] */
function mtg_card_shortcode($atts) {
	$atts = shortcode_atts(
		array(
			'name' => '',
			'set' => '',
			'number' => ''
		),
		$atts,
		'mtg_card'
	);

	$name = sanitize_text_field($atts['name']);
	$set = sanitize_text_field($atts['set']);
	$number = sanitize_text_field($atts['number']);
	$cache_key = 'mtg_card_' . md5($name . $set . $number);
	$card_data = get_transient($cache_key);

	if ($card_data === false) {
		$api_url = "https://api.scryfall.com/cards/named?fuzzy={$name}&set={$set}";
		if (!empty($set) && !empty($number)) {
			$api_url = "https://api.scryfall.com/cards/{$set}/{$number}";
		}

		$response = wp_remote_get($api_url);
		if (is_wp_error($response)) {
			return 'Failed to retrieve card data';
		}

		$body = wp_remote_retrieve_body($response);
		$card_data = json_decode($body, true);

		if (isset($card_data['object']) && $card_data['object'] === 'error') {
			return 'Card not found';
		}

		set_transient($cache_key, $card_data, 12 * HOUR_IN_SECONDS);
	}

	$scryfall_name = esc_html($card_data['name']);
	$front_image = esc_url($card_data['image_uris']['normal']);

	$output = '<span class="mtg-tooltip" data-tippy-content="' . htmlspecialchars('<img src="' . $front_image . '" alt="' . $scryfall_name . '" width="200">') . '">';
	$output .= $scryfall_name;
	$output .= '</span>';

	return $output;
}
add_shortcode('mtg_card', 'mtg_card_shortcode');

function enqueue_mana_font() {
	wp_enqueue_style( 'mana-font', '//cdn.jsdelivr.net/npm/mana-font@latest/css/mana.css', array(), null );
}
add_action( 'wp_enqueue_scripts', 'enqueue_mana_font' );

?>
