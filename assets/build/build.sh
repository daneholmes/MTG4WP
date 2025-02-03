#!/bin/zsh

# Configuration
PLUGIN_DIR=$(pwd)
PLUGIN_NAME=$(basename "$PLUGIN_DIR")
PARENT_DIR=$(dirname "$PLUGIN_DIR")
TEMP_DIR=$(mktemp -d)
ZIP_NAME="${PLUGIN_NAME}.zip"

# Function to convert readme.md to readme.txt with advanced extraction
convert_readme() {
    local input_file="$1"
    local output_file="$2"
    local main_php_file
    main_php_file=(*.php(N))
    main_php_file=$(grep -l "Plugin Name:" $main_php_file[1] 2>/dev/null)

    # Check if input file exists
    [[ ! -f "$input_file" ]] && { echo "❌ Input readme.md not found"; return 1; }
    [[ ! -f "$main_php_file" ]] && { echo "❌ Main plugin PHP file not found"; return 1; }

    # Extract plugin information from main PHP file
    local PLUGIN_VERSION=$(grep "Version:" "$main_php_file" | cut -d':' -f2 | xargs)
    local REQUIRES_WP=$(grep "Requires at least:" "$main_php_file" | cut -d':' -f2 | xargs)
    local REQUIRES_PHP=$(grep "Requires PHP:" "$main_php_file" | cut -d':' -f2 | xargs)
    local TESTED_UP_TO="${REQUIRES_WP}"

    # Extract description (truncate to 150 characters if needed)
    local DESCRIPTION=$(sed -n '/## Overview/,/## Prerequisites/p' "$input_file" | \
        sed -e 's/^## Overview//' -e 's/^## Prerequisites//' | \
        sed -E 's/^- //' | \
        sed -E 's/\*\*([^*]+)\*\*/\1/g' | \
        sed -E 's/\*([^*]+)\*/\1/g' | \
        tr -s ' ' | \
        sed '/^$/d' | \
        tr '\n' ' ' | \
        sed 's/^ *//; s/ *$//')

    # Truncate description to 150 characters
    DESCRIPTION=$(echo "$DESCRIPTION" | cut -c1-150)

    # Create readme.txt
    {
        echo "=== MTG4WP ==="
        echo "Contributors: daneholmes"
        echo "Tags: magic, mtg, trading card game, wordpress"
        echo "Requires at least: $REQUIRES_WP"
        echo "Requires PHP: $REQUIRES_PHP"
        echo "Tested up to: $TESTED_UP_TO"
        echo "Stable tag: $PLUGIN_VERSION"
        echo "License: GPLv3"
        echo "License URI: https://www.gnu.org/licenses/gpl-3.0.html"
        echo "$DESCRIPTION"
        echo ""
        echo "== Description =="
        echo "MTG4WP is a powerful WordPress plugin that seamlessly integrates Magic: The Gathering© card displays into your WordPress website. With a simple, intuitive Gutenberg block, you can showcase your decks and card collections with ease."
        echo ""
        echo "== Installation =="
        echo "1. Navigate to Plugins > Add New in your WordPress dashboard"
        echo "2. Search for \"MTG4WP\""
        echo "3. Click \"Install Now\" and then \"Activate\""
        echo ""
        echo "Alternatively, you can manually upload the plugin:"
        echo "1. Download the latest release"
        echo "2. Upload the plugin files to '/wp-content/plugins/MTG4WP'"
        echo "3. Activate the plugin through the 'Plugins' screen in WordPress"
        echo ""
        echo "== Frequently Asked Questions =="
        echo "= How do I add a deck? ="
        echo "1. Open a new page or post in the WordPress editor"
        echo "2. Click \"Add Block\""
        echo "3. Search for \"Deck\""
        echo "4. Add the block to your post"
        echo ""
        echo "= Where can I find collector numbers and set codes? ="
        echo "Look in the bottom left corner of modern Magic cards. Or, use online resources like Scryfall (https://scryfall.com)."
        echo ""
        echo "== Changelog =="
        echo "= $PLUGIN_VERSION ="
        local CHANGELOG_CURRENT=$(sed -n "/### ${PLUGIN_VERSION}/,/### /p" "$input_file" | \
            grep -v "### " | sed -E 's/^- \/* //' | tr -s ' ')
        echo "$CHANGELOG_CURRENT"
        echo ""
        echo "Plugin rebuild with improved caching, performance, and appearance."

        # Extract changelog section specifically
        local CHANGELOG_SECTION=$(awk '/^## Changelog/{flag=1; next} /^##/{flag=0} flag' "$input_file")

        # Look for previous versions and add their changelog entries
        local PREVIOUS_VERSIONS=$(echo "$CHANGELOG_SECTION" | awk '/^### [0-9.]/{print $2}')
        local previous_added=false

        # Process versions in the order they appear in the file
        while IFS= read -r version; do
            # Skip current version
            if [[ "$version" == "$PLUGIN_VERSION" ]]; then
                continue
            fi

            # Extract changelog for this version
            changelog=$(echo "$CHANGELOG_SECTION" | awk -v version="$version" '
                $0 ~ "### " version "$" { flag=1; next }
                /^### / { flag=0 }
                flag && /^- / { print substr($0, 3) }
            ' | tr -s ' ')

            if [[ -n "$changelog" ]]; then
                # Mark that we found a previous version
                previous_added=true

                echo ""
                echo "= ${version} ="
                echo "$changelog"
            fi
        done <<< "$PREVIOUS_VERSIONS"

        # Add a generic upgrade notice if previous versions exist
        if [[ "$previous_added" == "true" ]]; then
            echo ""
            echo "Plugin updates and improvements"
        fi
    } > "$output_file"

    echo "✓ Converted readme.md to readme.txt: $output_file"
}

echo -e "\n🚀 Starting build process for ${PLUGIN_NAME}..."

# Check for package.json
[[ ! -f "package.json" ]] && { echo "❌ package.json not found. Are you in the correct directory?"; exit 1; }

# Find main plugin file
MAIN_PHP_FILE=(*.php(N))
MAIN_PHP_FILE=$(grep -l "Plugin Name:" $MAIN_PHP_FILE[1] 2>/dev/null)
[[ -z "$MAIN_PHP_FILE" ]] && { echo "❌ No WordPress plugin main file found."; exit 1; }
echo "✓ Found main plugin file: $MAIN_PHP_FILE"

# Check npm
(( $+commands[npm] )) || { echo "❌ npm is not installed. Please install Node.js and npm first."; exit 1; }

# Run npm build
echo -e "\n📦 Running npm build..."
npm run build || { echo "❌ npm build failed."; exit 1; }

# Create necessary directories in temp location
echo -e "\n📁 Creating directory structure..."
mkdir -p "$TEMP_DIR/$PLUGIN_NAME/includes/"{api,models,services}

# Convert readme.md to readme.txt
convert_readme "readme.md" "$TEMP_DIR/$PLUGIN_NAME/readme.txt"

# Copy main plugin file
echo "📋 Copying main plugin file..."
cp "$MAIN_PHP_FILE" "$TEMP_DIR/$PLUGIN_NAME/"

# Copy LICENSE file
if [[ -f "LICENSE" ]]; then
    cp "LICENSE" "$TEMP_DIR/$PLUGIN_NAME/LICENSE"
    echo "📋 Copied LICENSE file"
elif [[ -f "LICENSE.txt" ]]; then
    cp "LICENSE.txt" "$TEMP_DIR/$PLUGIN_NAME/LICENSE"
    echo "📋 Copied LICENSE.txt file"
else
    echo "❌ No LICENSE or LICENSE.txt file found"
fi

# Copy includes directory with class files
echo "📋 Copying class files..."
cp includes/api/class-*.php(N) "$TEMP_DIR/$PLUGIN_NAME/includes/api/" 2>/dev/null || echo "No API classes found"
cp includes/models/class-*.php(N) "$TEMP_DIR/$PLUGIN_NAME/includes/models/" 2>/dev/null || echo "No model classes found"
cp includes/services/class-*.php(N) "$TEMP_DIR/$PLUGIN_NAME/includes/services/" 2>/dev/null || echo "No service classes found"

# Copy readme.txt to build directory if it exists
if [[ -f "$TEMP_DIR/$PLUGIN_NAME/readme.txt" ]]; then
    cp "$TEMP_DIR/$PLUGIN_NAME/readme.txt" "$PLUGIN_DIR/build/readme.txt" 2>/dev/null
    echo "📋 Copied readme.txt to build directory"
fi

# Copy build directory (contains compiled assets)
echo "📋 Copying build assets..."
cp -r build "$TEMP_DIR/$PLUGIN_NAME/"

# Create zip
echo "📦 Creating distribution zip file..."
(cd "$TEMP_DIR" && zip -r -q "$PARENT_DIR/$ZIP_NAME" "$PLUGIN_NAME")

# Clean up
rm -rf "$TEMP_DIR"

# Verify zip creation
if [[ -f "${PARENT_DIR}/${ZIP_NAME}" ]]; then
    echo -e "\n✅ Build completed successfully!"
    echo "📍 Distribution zip at: ${PARENT_DIR}/${ZIP_NAME}"
    echo "📦 Size: $(du -h "${PARENT_DIR}/${ZIP_NAME}" | cut -f1)"
    echo -e "\n📋 Contents:"
    unzip -l "${PARENT_DIR}/${ZIP_NAME}"
else
    echo -e "\n❌ Failed to create zip file."
    exit 1
fi