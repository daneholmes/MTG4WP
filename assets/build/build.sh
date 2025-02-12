#!/bin/zsh

# Configuration
PLUGIN_DIR=$(pwd)
PLUGIN_NAME=$(basename "$PLUGIN_DIR")
ZIP_NAME="${PLUGIN_NAME}.zip"
TEMP_DIR=$(mktemp -d)

# Create plugin and convert readme
create_plugin_files() {
    local main_php_file="MTG4WP.php"
    
    mkdir -p "$TEMP_DIR/$PLUGIN_NAME/includes/"{api,models,services}
    
    # Extract versions
    local VERSION=$(grep "Version:" "$main_php_file" | cut -d':' -f2 | xargs)
    local WP_VERSION=$(grep "Requires at least:" "$main_php_file" | cut -d':' -f2 | xargs)
    local PHP_VERSION=$(grep "Requires PHP:" "$main_php_file" | cut -d':' -f2 | xargs)
    local TESTED_WP=$(grep "Tested up to:" "$main_php_file" | cut -d':' -f2 | xargs)

    # Create readme.txt
    cat > "$TEMP_DIR/$PLUGIN_NAME/readme.txt" << EOF
=== ${PLUGIN_NAME} ===
Contributors: Dane Holmes
Tags: block, editor, gutenberg, Magic
Requires at least: ${WP_VERSION}
Requires PHP: ${PHP_VERSION}
Tested up to: ${TESTED_WP}
Stable tag: ${VERSION}
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

MTG4WP is a powerful WordPress plugin that seamlessly displays Magic: The Gathering cards on your WordPress website.

== Installation ==
1. Upload to '/wp-content/plugins/${PLUGIN_NAME}'
2. Activate the plugin
3. Start using the MTG block in your posts

== Changelog ==
EOF

    # Parse changelog
    awk '
        /^## Changelog$/ { in_changelog=1; next }
        /^## [^C]/ { in_changelog=0; next }
        in_changelog {
            if ($0 ~ /^### [0-9]+\.[0-9]+\.[0-9]+/) {
                if (version_count > 0) { print "" }
                version = $2
                print "= " version " ="
                version_count++
            }
            else if ($0 ~ /^- /) {
                print "- " substr($0, 3)
            }
        }
    ' "readme.md" >> "$TEMP_DIR/$PLUGIN_NAME/readme.txt"

    # Only copy production files
    cp MTG4WP.php "$TEMP_DIR/$PLUGIN_NAME/"
    cp -r build "$TEMP_DIR/$PLUGIN_NAME/"
    cp -r includes "$TEMP_DIR/$PLUGIN_NAME/"
    cp LICENSE "$TEMP_DIR/$PLUGIN_NAME/"
}

# Build
npm run build --no-warnings --loglevel=error || exit 1
create_plugin_files
(cd "$TEMP_DIR" && zip -r -q "$(dirname "$PLUGIN_DIR")/$ZIP_NAME" "$PLUGIN_NAME")
rm -rf "$TEMP_DIR"

# Check .zip was created
[[ -f "$(dirname "$PLUGIN_DIR")/$ZIP_NAME" ]] && exit 0 || exit 1