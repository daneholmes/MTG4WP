# mtg4wp - Magic: The Gathering WordPress Plugin

[![WordPress](https://img.shields.io/badge/WordPress-6.1%2B-blue.svg)](https://wordpress.org/download/)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)](https://www.php.net/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green.svg)](https://www.gnu.org/licenses/gpl-3.0.html)

mtg4wp is a powerful WordPress plugin that seamlessly displays Magic: The Gathering© cards on your WordPress website. With a simple, intuitive Gutenberg block, you can write about Magic showcase card collections with ease.

## Installation

### Method 1: WordPress Plugin Directory
1. Navigate to Plugins > Add New in your WordPress dashboard
2. Search for "mtg4wp"
3. Click "Install Now" and then "Activate"

### Method 2: Manual Upload
1. Download the latest release
2. Upload the plugin files to `/wp-content/plugins/mtg4wp`
3. Activate the plugin through the 'Plugins' screen in WordPress

### Method 3: Compilation
```zsh
# Clone the repository
git clone https://github.com/daneholmes/mtg4wp.git

# Navigate to the project directory
cd mtg4wp

# Install dependencies
npm install

# Build the plugin using provided script
./assets\/build\/build.sh
```

## Usage

### Adding a Deck
1. Open a new page or post in the WordPress editor
2. Click "Add Block"
3. Search for "Deck"
4. Add the block to your post

### Finding Collector Numbers and Set Codes
Look in the bottom left corner of modern Magic cards. Or, you can use online resources like [Scryfall](https://scryfall.com) for precise information

## Legal Notice

Magic Decks and Cards is unofficial Fan Content permitted under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). 

**Disclaimer:** Not approved/endorsed by Wizards of the Coast. Portions of the materials used are property of Wizards of the Coast LLC. ©Wizards of the Coast LLC.

## Changelog

### 1.0.0
- Initial release.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](https://www.gnu.org/licenses/gpl-3.0.html) for details.

## Contact

For support, please [open an issue](https://github.com/daneholmes/mtg4wp/issues) on the GitHub repository.

