<?php

namespace mtg4wp\Models;

class Card
{
    private string $id;
    private string $name;
    private string $type_line;
    private string $primary_type;
    private float $cmc;
    private array $faces;
    private string $layout;
    private bool $is_double_faced;
    private int $quantity;
    private bool $foil;
    private string $section;
    private int $current_face;
    private const SECTIONS = [
        'commander',
        'mainboard',
        'sideboard',
        'maybeboard',
        'token',
    ];

    // Constructor
    public function __construct(array $data)
    {
        $this->validate_data($data);

        // Core card properties
        $this->id = sanitize_text_field($data['id']);
        $this->name = sanitize_text_field($data['name']);
        $this->type_line = sanitize_text_field($data['type_line'] ?? '');
        $this->primary_type = $this->determine_primary_type();
        $this->cmc = (float) ($data['cmc'] ?? 0.0);
        $this->layout = sanitize_text_field($data['layout'] ?? 'normal');

        // Process faces data
        $this->faces = $this->process_faces($data);
        $this->is_double_faced = $this->determine_if_double_faced();

        // Deck-specific properties
        $this->quantity = 1;
        $this->foil = false;
        $this->section = 'mainboard';
        $this->current_face = 0;
    }

    // Validates required card data
    private function validate_data(array $data): void
    {
        if (empty($data['id'])) {
            throw new \InvalidArgumentException(
                esc_html__('Card data must include Scryfall ID.', 'l4m4w')
            );
        }
        if (empty($data['name'])) {
            throw new \InvalidArgumentException(
                esc_html__('Card data must include name.', 'l4m4w')
            );
        }
    }

    // Processes card faces data from Scryfall response
    private function process_faces(array $data): array
    {
        if (isset($data['card_faces']) && is_array($data['card_faces'])) {
            return array_map(function ($face) {
                return [
                    'name' => sanitize_text_field($face['name']),
                    'image' => esc_url_raw($face['image_uris']['normal'] ?? ''),
                    'mana_cost' => sanitize_text_field($face['mana_cost'] ?? ''),
                    'type_line' => sanitize_text_field($face['type_line'] ?? ''),
                ];
            }, $data['card_faces']);
        }

        return [[
            'name' => $this->name,
            'image' => esc_url_raw($data['image_uris']['normal'] ?? ''),
            'mana_cost' => sanitize_text_field($data['mana_cost'] ?? ''),
            'type_line' => $this->type_line,
        ]];
    }

    // Determines the primary type of a card based on its type line
    private function determine_primary_type(): string
    {
        $type_line = strtolower($this->type_line);

        // Check in order of precedence
        if (strpos($type_line, 'creature') !== false) {
            return 'creature';
        }
        if (strpos($type_line, 'planeswalker') !== false) {
            return 'planeswalker';
        }
        if (strpos($type_line, 'battle') !== false) {
            return 'battle';
        }
        if (strpos($type_line, 'artifact') !== false) {
            return 'artifact';
        }
        if (strpos($type_line, 'enchantment') !== false) {
            return 'enchantment';
        }
        if (strpos($type_line, 'instant') !== false) {
            return 'instant';
        }
        if (strpos($type_line, 'sorcery') !== false) {
            return 'sorcery';
        }
        if (strpos($type_line, 'land') !== false) {
            return 'land';
        }

        return 'other';
    }

    // Determines if card is double-faced based on layout
    private function determine_if_double_faced(): bool
    {
        return in_array(
            $this->layout,
            ['transform', 'modal_dfc', 'double_faced_token', 'battle'],
            true
        );
    }

    // Returns card data in block format
    public function to_block_format(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type_line' => $this->type_line,
            'primary_type' => $this->primary_type,
            'cmc' => $this->cmc,
            'faces' => $this->faces,
            'layout' => $this->layout,
            'isDoubleFaced' => $this->is_double_faced,
            'quantity' => $this->quantity,
            'foil' => $this->foil,
            'section' => $this->section,
            'currentFace' => $this->current_face,
        ];
    }

    // Getters
    public function get_id(): string
    {
        return $this->id;
    }

    public function get_name(): string
    {
        return $this->name;
    }

    public function get_faces(): array
    {
        return $this->faces;
    }

    public function get_current_face(): ?array
    {
        return $this->faces[$this->current_face] ?? null;
    }

    public function get_section(): string
    {
        return $this->section;
    }

    public function get_quantity(): int
    {
        return $this->quantity;
    }

    public function get_primary_type(): string
    {
        return $this->primary_type;
    }

    public function is_foil(): bool
    {
        return $this->foil;
    }

    // Setters
    public function set_quantity(int $quantity): void
    {
        $this->quantity = max(1, absint($quantity));
    }

    public function set_section(string $section): void
    {
        $section = strtolower(sanitize_text_field($section));
        $this->section = in_array($section, self::SECTIONS, true) ?
            $section : 'mainboard';
    }

    public function set_foil(bool $foil): void
    {
        $this->foil = (bool) $foil;
    }

    // Flips to the next face if card is double-faced
    public function flip(): void
    {
        if ($this->is_double_faced && count($this->faces) > 1) {
            $this->current_face = ($this->current_face + 1) % count($this->faces);
        }
    }
}