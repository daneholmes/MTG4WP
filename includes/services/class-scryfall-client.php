<?php

namespace mtg4wp\Services;

use Exception;

class ScryfallClient {

    private const API_BASE_URL='https://api.scryfall.com';
    private const CACHE_GROUP='mtg4wp_cards';
    private const CACHE_TTL=WEEK_IN_SECONDS;
    private const RATE_LIMIT=[
        'requests_per_second' => 10,
        'burst_limit'         => 100,
        'retry_after'         => 100,
    ];

    private function generate_name_cache_key( string $name, ?string $set=null ): string {
        return sprintf(
            'name_%s',
            md5( strtolower( $name ) . ( $set ? strtolower( $set ) : '' ) )
        );
    }

    private function generate_set_cache_key( string $set, string $number ): string {
        return sprintf(
            'set_%s_%s',
            strtolower( $set ),
            strtolower( $number )
        );
    }

    public function get_card( string $id ): ?array {
        try {
            $cache_key=strtolower( trim( $id ) );

            $cached=wp_cache_get( $cache_key, self::CACHE_GROUP );

            if ( false !== $cached ) {
                return $cached;
            }

            $data=$this->fetch_from_api( "/cards/$cache_key" );

            if ( $data ) {
                wp_cache_add( $cache_key, $data, self::CACHE_GROUP, self::CACHE_TTL );
            }

            return $data;
        } catch ( Exception $e ) {
            return null;
        }
    }

    public function get_card_by_name( string $name, ?string $set=null ): ?array {
        try {
            $cache_key=$this->generate_name_cache_key( $name, $set );

            $cached=wp_cache_get( $cache_key, self::CACHE_GROUP );

            if ( false !== $cached ) {
                return $cached;
            }

            $params=['fuzzy' => $name];

            if ( $set ) {
                $params['set']=$set;
            }

            $data=$this->fetch_from_api( '/cards/named', $params );

            if ( $data ) {
                wp_cache_add( $data['id'], $data, self::CACHE_GROUP, self::CACHE_TTL );
                wp_cache_add( $cache_key, $data, self::CACHE_GROUP, self::CACHE_TTL );
            }

            return $data;
        } catch ( Exception $e ) {
            return null;
        }
    }

    public function get_card_by_set_id( string $set, string $number ): ?array {
        try {
            $cache_key=$this->generate_set_cache_key( $set, $number );

            $cached=wp_cache_get( $cache_key, self::CACHE_GROUP );

            if ( false !== $cached ) {
                return $cached;
            }

            $set=sanitize_text_field( $set );
            $number=sanitize_text_field( $number );
            $endpoint="/cards/$set/$number";

            $data=$this->fetch_from_api( $endpoint );

            if ( $data ) {
                wp_cache_add( $data['id'], $data, self::CACHE_GROUP, self::CACHE_TTL );
                wp_cache_add( $cache_key, $data, self::CACHE_GROUP, self::CACHE_TTL );
            }

            return $data;
        } catch ( Exception $e ) {
            return null;
        }
    }

    public function clear_cache(): bool {
        return wp_cache_delete_group( self::CACHE_GROUP );
    }

    public function clear_card_cache( string $id ): bool {
        return wp_cache_delete( strtolower( trim( $id ) ), self::CACHE_GROUP );
    }

    private function fetch_from_api( string $endpoint, array $params=[] ): ?array {
        if ( !$this->check_rate_limit() ) {
            return null;
        }

        $url=self::API_BASE_URL . $endpoint;

        if ( $params ) {
            $url=add_query_arg( $params, $url );
        }

        $response=wp_remote_get( $url, [
            'timeout' => 15,
            'headers' => [
                'User-Agent' => 'MTG4WP/1.0.0',
                'Accept'     => 'application/json',
            ],
        ] );

        if ( is_wp_error( $response ) ) {
            return null;
        }

        if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
            return null;
        }

        $data=json_decode( wp_remote_retrieve_body( $response ), true );

        if ( !$this->validate_card_data( $data ) ) {
            return null;
        }

        return $data;
    }

    private function validate_card_data( $data ): bool {
        return is_array( $data ) &&
               isset( $data['id'], $data['name'] ) &&
               !empty( $data['id'] ) &&
               !empty( $data['name'] );
    }

    private function check_rate_limit(): bool {
        static $last_check=0;
        static $remaining=self::RATE_LIMIT['burst_limit'];

        $now=microtime( true );
        $elapsed=$now - $last_check;

        if ( $elapsed >= 1 ) {
            $remaining=self::RATE_LIMIT['burst_limit'];
        } else {
            $remaining += $elapsed * self::RATE_LIMIT['requests_per_second'];

            if ( $remaining > self::RATE_LIMIT['burst_limit'] ) {
                $remaining=self::RATE_LIMIT['burst_limit'];
            }
        }

        $last_check=$now;

        if ( $remaining < 1 ) {
            return false;
        }

        $remaining--;

        return true;
    }
}
