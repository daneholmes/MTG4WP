<?php

namespace MTG4WP\Models;

class Card
{
    private $id;
    private $name;
    private $set;
    private $collector_number;
    private $type_line;
    private $primary_type;
    private $cmc;
    private $faces;
    private $layout;
    private $rarity;
    private $is_double_faced;
    private $quantity;
    private $foil;
    private $section;
    private $current_face;
    private const VALID_SECTIONS = [
        'commander',
        'mainboard',
        'sideboard',
        'maybeboard',
        'token',
    ];
    private const CARD_TYPES = [
        'creature'     => 0,
        'planeswalker' => 1,
        'artifact'     => 2,
        'battle'       => 3,
        'enchantment'  => 4,
        'instant'      => 5,
        'sorcery'      => 6,
        'land'         => 7,
    ];

    public function __construct(array $scryfall_data)
    {
        $this->validate_scryfall_data($scryfall_data);
        $this->id               = sanitize_text_field($scryfall_data['id']);
        $this->name            = sanitize_text_field($scryfall_data['name']);
        $this->set             = sanitize_text_field($scryfall_data['set']);
        $this->collector_number = sanitize_text_field($scryfall_data['collector_number']);
        $this->type_line       = sanitize_text_field($scryfall_data['type_line'] ?? '');
        $this->primary_type    = $this->determine_primary_type();
        $this->cmc             = $this->calculate_cmc($scryfall_data);
        $this->faces           = $this->process_card_faces($scryfall_data);
        $this->layout          = sanitize_text_field($scryfall_data['layout']);
        $this->rarity          = sanitize_text_field($scryfall_data['rarity']);
        $this->is_double_faced = $this->determine_if_double_faced();
        // Default values for deck-specific properties
        $this->quantity     = 1;
        $this->foil        = false;
        $this->section     = 'mainboard';
        $this->current_face = 0;
    }

    // Validate Scryfall data
    private function validate_scryfall_data(array $data): void
    {
        $required_fields = ['id', 'name', 'set', 'collector_number'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                throw new \InvalidArgumentException(
                    sprintf(
                        esc_html__('Missing required field: %s', 'mtg4wp'),
                        $field
                    )
                );
            }
        }
    }

    // Convert to array format for block attributes
    public function to_block_format(): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'set'             => $this->set,
            'collector_number' => $this->collector_number,
            'type_line'       => $this->type_line,
            'primary_type'    => $this->primary_type,
            'cmc'             => $this->cmc,
            'faces'           => $this->faces,
            'layout'          => $this->layout,
            'rarity'          => $this->rarity,
            'isDoubleFaced'   => $this->is_double_faced,
            'quantity'        => $this->quantity,
            'foil'            => $this->foil,
            'section'         => $this->section,
            'currentFace'     => $this->current_face,
        ];
    }

    // Set card quantity
    public function set_quantity(int $quantity): void
    {
        $this->quantity = max(1, absint($quantity));
    }

    // Set deck section
    public function set_section(string $section): void
    {
        $section = strtolower(sanitize_text_field($section));
        $this->section = in_array($section, self::VALID_SECTIONS, true) ? $section : 'mainboard';
    }

    // Set foil status
    public function set_foil(bool $foil): void
    {
        $this->foil = (bool) $foil;
    }

    // Get card sort weight based on type and CMC
    public function get_sort_weight(): array
    {
        return [
            'section_weight' => array_search($this->section, self::VALID_SECTIONS, true),
            'type_weight'    => self::CARD_TYPES[$this->primary_type] ?? 999,
            'cmc'           => $this->cmc,
            'name'          => $this->name,
        ];
    }

    // Determine primary card type
    private function determine_primary_type(): string
    {
        if (empty($this->type_line)) {
            return 'artifact';
        }

        $type_line = strtolower($this->type_line);
        $type_line = preg_replace('/^(legendary|basic|snow|world|token)\s+/i', '', $type_line);
        $types = preg_split('/\s+/', $type_line);

        // Check for priority types first
        if (in_array('creature', $types, true)) {
            return 'creature';
        }
        if (in_array('planeswalker', $types, true)) {
            return 'planeswalker';
        }
        if (in_array('land', $types, true)) {
            return 'planeswalker';
        }

        // Look for other recognized types
        foreach ($types as $type) {
            if (isset(self::CARD_TYPES[$type])) {
                return $type;
            }
        }

        return 'artifact';
    }

    // Calculate converted mana cost.
    private function calculate_cmc(array $data): float
    {
        if (isset($data['cmc'])) {
            return (float) $data['cmc'];
        }

        $mana_cost = $data['faces'][0]['mana_cost'] ?? '';
        if (empty($mana_cost)) {
            return 0.0;
        }

        preg_match_all('/\{([^}]+)\}/', $mana_cost, $matches);
        if (empty($matches[1])) {
            return 0.0;
        }

        return array_reduce(
            $matches[1],
            function ($total, $symbol) {
                if ($symbol === 'X') {
                    return $total;
                }
                return $total + (is_numeric($symbol) ? (float) $symbol : 1.0);
            },
            0.0
        );
    }

    // Process card faces
    private function process_card_faces(array $data): array
    {
        $faces = [];

        if (isset($data['card_faces']) && is_array($data['card_faces'])) {
            foreach ($data['card_faces'] as $face) {
                $faces[] = [
                    'name'        => sanitize_text_field($face['name']),
                    'type_line'   => sanitize_text_field($face['type_line'] ?? ''),
                    'oracle_text' => wp_kses_post($face['oracle_text'] ?? ''),
                    'image'       => esc_url_raw($face['image_uris']['normal'] ?? ''),
                    'mana_cost'   => sanitize_text_field($face['mana_cost'] ?? ''),
                ];
            }
            return $faces;
        }

        // Single-faced card
        $faces[] = [
            'name'        => $this->name,
            'type_line'   => $this->type_line,
            'oracle_text' => wp_kses_post($data['oracle_text'] ?? ''),
            'image'       => esc_url_raw($data['image_uris']['normal'] ?? ''),
            'mana_cost'   => sanitize_text_field($data['mana_cost'] ?? ''),
        ];

        return $faces;
    }

    //Determine if card is double-faced
    private function determine_if_double_faced(): bool
    {
        return in_array(
            $this->layout,
            ['transform', 'modal_dfc', 'double_faced_token', 'battle'],
            true
        );
    }

    // Get card faces
    public function get_faces(): array
    {
        return $this->faces;
    }

    //Get current face
    public function get_current_face(): ?array
    {
        return $this->faces[$this->current_face] ?? null;
    }

    // Flip to next face
    public function flip(): void
    {
        if ($this->is_double_faced && count($this->faces) > 1) {
            $this->current_face = ($this->current_face + 1) % count($this->faces);
        }
    }

    // Get card name
    public function get_name(): string
    {
        return $this->name;
    }

    // Get primary type
    public function get_primary_type(): string
    {
        return $this->primary_type;
    }

    // Get CMC
    public function get_cmc(): float
    {
        return $this->cmc;
    }

    // Get section
    public function get_section(): string
    {
        return $this->section;
    }
}
