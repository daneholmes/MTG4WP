import { __ } from '@wordpress/i18n';
import {
    ExternalLink,
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
                throw new Error(__('Please provide a card name or set and collector number.', 'l4m4w'));
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
                error: err.message || __('An error occurred while searching for cards.', 'l4m4w'),
            });
        }
    };

    const isSearchDisabled = searching || (!searchTerm.trim() && (!searchSet.trim() || !searchNumber.trim()));

    return (
        <div className="mtg4wp-card-search">
            <div className="mtg4wp-section-header">
                <div className="mtg4wp-header-content">
                    <Heading level={2}>
                        {__('Add Cards', 'l4m4w')}
                    </Heading>
                    <Button 
                        variant="secondary"
                        onClick={onOpenImporter}
                        className="mtg4wp-import-button"
                    >
                        {__('Import Deck', 'l4m4w')}
                    </Button>
                </div>
            </div>
            
            <TextControl
                label={__('Card Name', 'l4m4w')}
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={__("e.g. Sensei's Divining Top", 'l4m4w')}
                help={__('Enter a card name', 'l4m4w')}
            />
            
            <TextControl
                label={__('Set Code', 'l4m4w')}
                value={searchSet}
                onChange={setSearchSet}
                placeholder={__('e.g. chk', 'l4m4w')}
                help={
                    <>
                        {__('For a specific printing enter a set code.', 'l4m4w')}{' '}
                        <ExternalLink
                            href="#"
                            rel="nofollow noreferrer"
                        >
                            {__('Learn more', 'l4m4w')}
                        </ExternalLink>
                    </>
                }
            />
            
            <TextControl
                label={__('Card Number', 'l4m4w')}
                value={searchNumber}
                onChange={setSearchNumber}
                placeholder={__('e.g. 268', 'l4m4w')}
                help={
                    <>
                        {__('Enter the card\'s collector number.', 'l4m4w')}{' '}
                        <ExternalLink
                            href="#"
                            rel="nofollow noreferrer"
                        >
                            {__('Learn more', 'l4m4w')}
                        </ExternalLink>
                    </>
                }
            />
            
            <Button 
                variant="primary"
                onClick={handleSearch}
                disabled={isSearchDisabled}
                isBusy={searching}
            >
                {searching ? __('Searching...', 'l4m4w') : __('Add Card', 'l4m4w')}
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