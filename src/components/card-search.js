import { __ } from '@wordpress/i18n';
import {
    TextControl,
    Button,
    Notice,
    __experimentalHeading as Heading
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const CardSearch = ({ attributes = {}, setAttributes, onAddCard, onOpenImporter }) => {
    const { searching = false, error = '' } = attributes;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSet, setSearchSet] = useState('');
    const [searchNumber, setSearchNumber] = useState('');

    const handleSearch = async () => {
        if (!setAttributes || typeof setAttributes !== 'function') {
            return;
        }

        try {
            setAttributes({ searching: true, error: '' });
            
            const queryParams = new URLSearchParams();
            
            if (searchTerm.trim()) {
                queryParams.append('name', searchTerm.trim());
            }
            if (searchSet.trim()) {
                queryParams.append('set', searchSet.trim());
            }
            if (searchNumber.trim()) {
                queryParams.append('number', searchNumber.trim());
            }

            if (queryParams.toString() === '') {
                throw new Error(__('Please provide a card name or set and collector number.', 'MTG4WP'));
            }
    
            const response = await apiFetch({
                path: `/mtg4wp/v1/cards?${queryParams.toString()}`,
                method: 'GET',
            });

            if (response && typeof onAddCard === 'function') {
                onAddCard(response);
                
                // Reset form
                setSearchTerm('');
                setSearchSet('');
                setSearchNumber('');
                
                setAttributes({ 
                    searching: false,
                    error: '',
                });
            }
        } catch (err) {
            setAttributes({ 
                searching: false,
                error: err.message || __('An error occurred while searching for cards.', 'MTG4WP'),
            });
        }
    };

    const isSearchDisabled = searching || (!searchTerm.trim() && (!searchSet.trim() || !searchNumber.trim()));

    return (
        <div className="mtg4wp-card-search">
            <div className="mtg4wp-section-header">
                <div className="mtg4wp-header-content">
                    <Heading level={2}>
                        {__('Add Cards', 'MTG4WP')}
                    </Heading>
                    <Button 
                        variant="secondary"
                        onClick={onOpenImporter}
                        className="mtg4wp-import-button"
                    >
                        {__('Import Deck', 'MTG4WP')}
                    </Button>
                </div>
            </div>
            
            <TextControl
                label={__('Card Name', 'MTG4WP')}
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={__('e.g. Lightning Bolt', 'MTG4WP')}
                help={__('Enter the name of the card you want to add', 'MTG4WP')}
            />
            
            <TextControl
                label={__('Set Code', 'MTG4WP')}
                value={searchSet}
                onChange={setSearchSet}
                placeholder={__('e.g. MOM', 'MTG4WP')}
                help={__('Enter the three-letter set code', 'MTG4WP')}
            />
            
            <TextControl
                label={__('Card Number', 'MTG4WP')}
                value={searchNumber}
                onChange={setSearchNumber}
                placeholder={__('e.g. 61', 'MTG4WP')}
                help={__('Enter the collector number', 'MTG4WP')}
            />
            
            <Button 
                variant="primary"
                onClick={handleSearch}
                disabled={isSearchDisabled}
                isBusy={searching}
            >
                {searching ? __('Searching...', 'MTG4WP') : __('Add Card', 'MTG4WP')}
            </Button>
            
            {error && (
                <Notice 
                    status="error" 
                    isDismissible={false}
                    className="mtg4wp-error-notice"
                >
                    {error}
                </Notice>
            )}
        </div>
    );
};

export default CardSearch;