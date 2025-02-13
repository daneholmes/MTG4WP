<?php

namespace mtg4wp\Models;

use InvalidArgumentException;

class Card {

    private string $id;

    private string $name;

    private string $type_line;

    private string $primary_type;

    private float $cmc;

    private array $faces;

    private string $layout;

    private int $current_face;

    private int $quantity;

    private array $layout_info;

    private bool $foil;

    private string $section;
    private const SECTIONS=[
        'commander',
        'mainboard',
        'sideboard',
        'maybeboard',
        'token',
    ];
    private const LAYOUT_TYPES=[
        'normal' => [
            'transform_type'   => 'none',
            'display_type'     => 'single',
            'button_text'      => '',
            'button_icon'      => '',
            'rotate_direction' => '',
        ],
        'transform' => [
            'transform_type'   => 'turn-over',
            'display_type'     => 'double_faced',
            'button_text'      => 'Transform',
            'button_icon'      => 'flip-horizontal',
            'rotate_direction' => '',
        ],
        'modal_dfc' => [
            'transform_type'   => 'turn-over',
            'display_type'     => 'double_faced',
            'button_text'      => 'Transform',
            'button_icon'      => 'flip-horizontal',
            'rotate_direction' => '',
        ],
        'split' => [
            'transform_type'   => 'rotate',
            'display_type'     => 'single',
            'button_text'      => 'Rotate',
            'button_icon'      => 'rotate-right',
            'rotate_direction' => 'rotate-right',
        ],
        'flip' => [
            'transform_type'   => 'flip',
            'display_type'     => 'single',
            'button_text'      => 'Flip',
            'button_icon'      => 'flip-vertical',
            'rotate_direction' => '',
        ],
        'adventure' => [
            'transform_type'   => 'none',
            'display_type'     => 'single',
            'button_text'      => '',
            'button_icon'      => '',
            'rotate_direction' => '',
        ],
        'battle' => [
            'transform_type'   => 'turn-over',
            'display_type'     => 'double_faced',
            'button_text'      => 'Transform',
            'button_icon'      => 'flip-horizontal',
            'rotate_direction' => '',
        ],
    ];

    public function __construct( array $data ) {
        $this->validate_data( $data );
        $this->id=sanitize_text_field( $data['id'] );
        $this->name=sanitize_text_field( $data['name'] );
        $this->type_line=sanitize_text_field( $data['type_line'] ?? '' );
        $this->cmc=(float) ( $data['cmc'] ?? 0.0 );
        $this->layout=sanitize_text_field( $data['layout'] ?? 'normal' );
        $this->faces=$this->process_faces( $data );
        $this->current_face=0;
        $this->quantity=1;
        $this->foil=false;
        $this->section='mainboard';

        // Process layout info during construction
        $this->layout_info=self::LAYOUT_TYPES[$this->layout] ?? self::LAYOUT_TYPES['normal'];

        if ( $this->layout === 'split' &&
            isset( $data['keywords'] ) &&
            in_array( 'Aftermath', $data['keywords'], true ) ) {
            $this->layout_info['button_icon']='rotate-left';
            $this->layout_info['rotate_direction']='rotate-left';
        }

        $this->primary_type=$this->determine_primary_type();
    }

    private function process_faces( array $data ): array {
        // Handle multi-faced cards
        if ( isset( $data['card_faces'] ) && is_array( $data['card_faces'] ) ) {
            return array_map( function ( $face ) use ( $data ) {
                // Different image handling based on layout
                $image=match ( $this->layout ) {
                    // Split and flip cards share one image
                    'split', 'flip' => esc_url_raw( $data['image_uris']['normal'] ?? '' ),
                    // Adventure cards use the main card image
                    'adventure' => esc_url_raw( $data['image_uris']['normal'] ?? '' ),
                    // Transform, modal_dfc, and battle cards use individual face images
                    default => isset( $face['image_uris'] ) ?
                        esc_url_raw( $face['image_uris']['normal'] ?? '' ) :
                        ''
                };

                return [
                    'name'      => sanitize_text_field( $face['name'] ),
                    'type_line' => sanitize_text_field( $face['type_line'] ?? '' ),
                    'image'     => $image,
                    'keywords'  => isset( $face['keywords'] ) ? array_map( 'sanitize_text_field', $face['keywords'] ) : [],
                ];
            }, $data['card_faces'] );
        }

        // Handle single-faced cards
        return [[
            'name'      => $this->name,
            'type_line' => $this->type_line,
            'image'     => esc_url_raw( $data['image_uris']['normal'] ?? '' ),
            'keywords'  => isset( $data['keywords'] ) ? array_map( 'sanitize_text_field', $data['keywords'] ) : [],
        ]];
    }

    private function determine_primary_type(): string {
        // For split cards, use the type of the first face
        $type_line=$this->layout === 'split'
            ? strtolower( $this->faces[0]['type_line'] ?? $this->type_line )
            : strtolower( $this->faces[0]['type_line'] ?? $this->type_line );

        $type_patterns=[
            'token'        => '/\btoken\b/',
            'creature'     => '/\bcreature\b/',
            'planeswalker' => '/\bplaneswalker\b/',
            'battle'       => '/\bbattle\b/',
            'land'         => '/\bland\b/',
            'artifact'     => '/\bartifact\b/',
            'enchantment'  => '/\benchantment\b/',
            'instant'      => '/\binstant\b/',
            'sorcery'      => '/\bsorcery\b/',
        ];

        // Check each type in order of precedence
        foreach ( $type_patterns as $type => $pattern ) {
            if ( preg_match( $pattern, $type_line ) ) {
                return $type;
            }
        }

        return 'other';
    }

    public function get_full_name(): string {
        if ( $this->layout === 'split' ) {
            return implode( ' // ', array_map( function ( $face ) {
                return $face['name'];
            }, $this->faces ) );
        }

        return $this->name;
    }

    public function can_transform(): bool {
        return count( $this->faces ) > 1 &&
               isset( self::LAYOUT_TYPES[$this->layout]['transform_type'] ) &&
               self::LAYOUT_TYPES[$this->layout]['transform_type'] !== 'none';
    }

    public function transform(): void {
        if ( $this->can_transform() ) {
            $this->current_face=( $this->current_face + 1 ) % count( $this->faces );
        }
    }

    public function get_current_face(): ?array {
        return $this->faces[$this->current_face] ?? null;
    }

    public function to_block_format(): array {
        return [
            'id'               => $this->id,
            'name'             => $this->get_full_name(),
            'type_line'        => $this->type_line,
            'primary_type'     => $this->primary_type,
            'cmc'              => $this->cmc,
            'faces'            => $this->faces,
            'layout'           => $this->layout,
            'current_face'     => $this->current_face,
            'quantity'         => $this->quantity,
            'foil'             => $this->foil,
            'section'          => $this->section,
            'transform_type'   => $this->layout_info['transform_type'],
            'display_type'     => $this->layout_info['display_type'],
            'buttonText'       => $this->layout_info['button_text'],
            'buttonIcon'       => $this->layout_info['button_icon'],
            'rotate_direction' => $this->layout_info['rotate_direction'],
            'can_transform'    => $this->can_transform(),
        ];
    }

    private function validate_data( array $data ): void {
        if ( empty( $data['id'] ) ) {
            throw new InvalidArgumentException( esc_html__( 'Card data must include Scryfall ID.', 'l4m4w' ) );
        }

        if ( empty( $data['name'] ) ) {
            throw new InvalidArgumentException( esc_html__( 'Card data must include name.', 'l4m4w' ) );
        }
    }

    // Getters and setters
    public function get_id(): string {
        return $this->id;
    }

    public function get_name(): string {
        return $this->name;
    }

    public function get_section(): string {
        return $this->section;
    }

    public function get_quantity(): int {
        return $this->quantity;
    }

    public function get_primary_type(): string {
        return $this->primary_type;
    }

    public function is_foil(): bool {
        return $this->foil;
    }

    public function set_quantity( int $quantity ): void {
        $this->quantity=max( 1, absint( $quantity ) );
    }

    public function set_section( string $section ): void {
        $section=strtolower( sanitize_text_field( $section ) );
        $this->section=in_array( $section, self::SECTIONS, true ) ?
            $section : 'mainboard';
    }

    public function set_foil( bool $foil ): void {
        $this->foil=(bool) $foil;
    }
}
