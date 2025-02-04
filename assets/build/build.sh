#!/bin/zsh

# Configuration
PLUGIN_DIR=$(pwd)
PLUGIN_NAME=$(basename "$PLUGIN_DIR")
PARENT_DIR=$(dirname "$PLUGIN_DIR")
TEMP_DIR=$(mktemp -d)
ZIP_NAME="${PLUGIN_NAME}.zip"

# Function to convert readme.md to readme.txt
convert_readme() {
    local input_file="$1"
    local output_file="$2"
    local main_php_file
    main_php_file=(*.php(N))
    main_php_file=$(grep -l "Plugin Name:" $main_php_file[1] 2>/dev/null)

    [[ ! -f "$input_file" ]] && { echo "❌ Input readme.md not found"; return 1; }
    [[ ! -f "$main_php_file" ]] && { echo "❌ Main plugin PHP file not found"; return 1; }

    # Extract plugin information
    local PLUGIN_VERSION=$(grep "Version:" "$main_php_file" | cut -d':' -f2 | xargs)
    local REQUIRES_WP=$(grep "Requires at least:" "$main_php_file" | cut -d':' -f2 | xargs)
    local REQUIRES_PHP=$(grep "Requires PHP:" "$main_php_file" | cut -d':' -f2 | xargs)
    local TESTED_UP_TO=$(grep "Tested up to:" "$main_php_file" | cut -d':' -f2 | xargs)

    # Extract first sentence from Overview section for short description
    local DESCRIPTION=$(awk '/^## Overview/{p=1;next} /^##/{p=0} p' "$input_file" | \
        sed -e 's/^- //' \
            -e 's/\[\([^]]*\)\]([^)]*)/*\1*/g' \
            -e 's/`\([^`]*\)`/*\1*/g' | \
        tr -d '\n' | sed 's/  */ /g' | sed 's/^ *//' | sed 's/ *$//' | \
        awk -F. '{ print $1 "." }')

    # Create readme.txt header
    {
        echo "=== ${PLUGIN_NAME} ==="
        echo "Contributors: daneholmes"
        echo "Tags: magic, mtg, trading card game, wordpress"
        echo "Requires at least: ${REQUIRES_WP}"
        echo "Requires PHP: ${REQUIRES_PHP}"
        echo "Tested up to: ${TESTED_UP_TO}"
        echo "Stable tag: ${PLUGIN_VERSION}"
        echo "License: GPLv3"
        echo "License URI: https://www.gnu.org/licenses/gpl-3.0.html"
        echo ""
        echo "${DESCRIPTION}"
        echo ""
        echo "== Description =="
        
        # Extract full description including legal notice
        awk '/^## Overview/,/^## Prerequisites/' "$input_file" | \
            grep -v "^## " | sed 's/^- //' | sed '/^$/d'
        
        echo ""
        echo "=== Legal Notice ==="
        awk '/^## Legal Notice/,/^##/{
            if (!/^## / && NF) print
        }' "$input_file"
        
        echo ""
        echo "== Installation =="
        echo "1. Navigate to Plugins > Add New in your WordPress dashboard"
        echo "2. Search for \"${PLUGIN_NAME}\""
        echo "3. Click \"Install Now\" and then \"Activate\""
        echo ""
        echo "Alternatively, you can manually upload the plugin:"
        echo "1. Download the latest release"
        echo "2. Upload the plugin files to '/wp-content/plugins/${PLUGIN_NAME}'"
        echo "3. Activate the plugin through the 'Plugins' screen in WordPress"
        
        echo ""
        echo "== Frequently Asked Questions =="
        echo ""
        echo "= How do I add a deck? ="
        awk '/^### Adding a Deck/,/^###/{
            if (!/^### / && NF) print
        }' "$input_file"
        
        echo ""
        echo "= Where can I find collector numbers and set codes? ="
        awk '/^### Finding Collector Numbers/,/(^###|^## )/{
            if (!/^### / && NF) print
        }' "$input_file"
        
        echo ""
        echo "== Changelog =="

        # Process changelog section with bullet points preserved
        awk '
            /^## Changelog$/ { in_changelog=1; next }
            /^## [^C]/ { in_changelog=0; next }
            in_changelog {
                if ($0 ~ /^### [0-9]+\.[0-9]+\.[0-9]+/) {
                    version = $2
                    print "= " version " ="
                }
                else if ($0 ~ /^- /) {
                    print "- " substr($0, 3)
                }
                else if (NF == 0 && prev_line !~ /^== Changelog/) {
                    print ""
                }
            }
            { prev_line = $0 }
        ' "$input_file"
        

    } > "$output_file"

    echo "✓ Converted readme.md to readme.txt: $output_file"
}

echo -e "\n🚀 Starting build process for ${PLUGIN_NAME}..."

# Basic checks
[[ ! -f "package.json" ]] && { echo "❌ package.json not found"; exit 1; }
MAIN_PHP_FILE=(*.php(N))
MAIN_PHP_FILE=$(grep -l "Plugin Name:" $MAIN_PHP_FILE[1] 2>/dev/null)
[[ -z "$MAIN_PHP_FILE" ]] && { echo "❌ No WordPress plugin main file found"; exit 1; }
echo "✓ Found main plugin file: $MAIN_PHP_FILE"

# Run npm build
echo -e "\n📦 Running npm build..."
npm run build || { echo "❌ npm build failed"; exit 1; }

# Create directory structure
echo -e "\n📁 Creating directory structure..."
mkdir -p "$TEMP_DIR/$PLUGIN_NAME/includes/"{api,models,services}

# Convert readme
convert_readme "readme.md" "$TEMP_DIR/$PLUGIN_NAME/readme.txt"

# Copy files
echo "📋 Copying files..."
cp "$MAIN_PHP_FILE" "$TEMP_DIR/$PLUGIN_NAME/"
cp LICENSE{,.txt}(N) "$TEMP_DIR/$PLUGIN_NAME/" 2>/dev/null || echo "⚠️ No LICENSE file found"

# Copy class files maintaining directory structure
echo "📋 Copying class files..."
local class_dirs=("api" "models" "services")
for dir in $class_dirs; do
    # Create directory if it has files to copy
    if [[ -n "$(ls includes/$dir/class-*.php 2>/dev/null)" ]]; then
        mkdir -p "$TEMP_DIR/$PLUGIN_NAME/includes/$dir"
        cp includes/$dir/class-*.php "$TEMP_DIR/$PLUGIN_NAME/includes/$dir/" 2>/dev/null
    fi
done

# Copy root level class files
cp includes/class-*.php "$TEMP_DIR/$PLUGIN_NAME/includes/" 2>/dev/null

# Copy build directory
cp -r build "$TEMP_DIR/$PLUGIN_NAME/"

# Create distribution zip
echo "📦 Creating distribution zip..."
(cd "$TEMP_DIR" && zip -r -q "$PARENT_DIR/$ZIP_NAME" "$PLUGIN_NAME")

# Clean up
rm -rf "$TEMP_DIR"

# Verify zip
if [[ -f "${PARENT_DIR}/${ZIP_NAME}" ]]; then
    echo -e "\n✅ Build completed successfully!"
    echo "📍 Distribution zip: ${PARENT_DIR}/${ZIP_NAME}"
    echo "📦 Size: $(du -h "${PARENT_DIR}/${ZIP_NAME}" | cut -f1)"
    echo -e "\n📋 Contents:"
    unzip -l "${PARENT_DIR}/${ZIP_NAME}"
else
    echo "❌ Failed to create zip file"
    exit 1
fi