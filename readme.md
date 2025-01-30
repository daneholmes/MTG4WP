# MTG4WP
Contributors:      Dane Holmes
Tags:              block
Requires at least: 6.7
Tested up to:      6.7.1
Stable tag:        2.0.0
Requires PHP:      
License:           GPL-3.0-only
License URI:       https://www.gnu.org/licenses/gpl-3.0.html

A plugin for displaying Magic: The Gathering© on Wordpress.

## Description

*MTG4WP* adds a block to the Gutenberg Editor called "Deck." The Deck block allows you to create and display Magic decks by adding card names and/or set and collector numbers. After adding your desired cards, the plugin does all the work, organizing the cards and displaying your deck on your website compactly and comprehensively. Additionally, it adds a shortcode which adds a tooltip with a picture of the card when the user hovers or clicks on the card.

## Installation

1. Upload the plugin files to the `/wp-content/plugins/mtg-tools` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress

## Frequently Asked Questions

**How do I add a deck?**

Open a new page or post. Choose a new block from the editor. Then finally, search for "Deck" and add it to your post.

**What are the required block inputs?**

A permutation of set code, collector number, and card name must be added to display a card.
1. If you only input card name it will display the most recent printing of the specified card. Note that the name doesn't have to be exact, but will display the exact name.
2. If you put in card name and set code it will display the printing with the lowest collector number from your desired set.
3. If you put in set code and collector number it will display the exact printing. With both set code and collector number card name is effectively optional.

Selecting "Foil" will add a slight foil-like animation to the card image and is optional.

Quantity defaults to one and is required.

Selecting "Commander" will designate selected card(s) as your deck's commander and is Optional.

**How do I use the Shortcode?**

The shortcode is called mtg_name and has three inputs: name, set, and number. Below are examples of how to use the shortcode and both examples will return the same card:
```
[mtg_card name="Adeline, Resplendent Cathar"]
[mtg_card set="mid" number="1"]
```
It follows the same logic as the deck so you either need name, name and set, or set and number.

**How can I find collector number and set code?**.

The set code and the collector numbers are found in the bottom left corner of modern Magic cards. Alternatively, you can look them up using a tool like [Scryfall](https://scryfall.com).

**What formats can this plugin display?**

I believe all of them.

## Notices

Magic Decks and Cards is unofficial Fan Content permitted under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

## Changelog

**2.0.0**
* Completely rebuilt app.

**1.0.0**
* Initial release.
