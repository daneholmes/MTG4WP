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
                throw new Error(__('Please provide a card name or set and collector number.', 'mtg4wp'));
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
                error: err.message || __('An error occurred while searching for cards.', 'mtg4wp'),
            });
        }
    };

    const isSearchDisabled = searching || (!searchTerm.trim() && (!searchSet.trim() || !searchNumber.trim()));

    return (
        <div className="mtg4wp-card-search">
            <div className="mtg4wp-section-header">
                <div className="mtg4wp-header-content">
                    <Heading level={2}>
                        {__('Add Cards', 'mtg4wp')}
                    </Heading>
                    <Button 
                        variant="secondary"
                        onClick={onOpenImporter}
                        className="mtg4wp-import-button"
                    >
                        {__('Import Deck', 'mtg4wp')}
                    </Button>
                </div>
            </div>
            
            <TextControl
                label={__('Card Name', 'mtg4wp')}
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={__('e.g. Lightning Bolt', 'mtg4wp')}
                help={__('Enter the name of the card you want to add', 'mtg4wp')}
            />
            
            <TextControl
                label={__('Set Code', 'mtg4wp')}
                value={searchSet}
                onChange={setSearchSet}
                placeholder={__('e.g. MOM', 'mtg4wp')}
                help={__('Enter the three-letter set code', 'mtg4wp')}
            />
            
            <TextControl
                label={__('Card Number', 'mtg4wp')}
                value={searchNumber}
                onChange={setSearchNumber}
                placeholder={__('e.g. 61', 'mtg4wp')}
                help={__('Enter the collector number', 'mtg4wp')}
            />
            
            <Button 
                variant="primary"
                onClick={handleSearch}
                disabled={isSearchDisabled}
                isBusy={searching}
            >
                {searching ? __('Searching...', 'mtg4wp') : __('Add Card', 'mtg4wp')}
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