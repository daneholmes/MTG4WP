import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody, PanelRow, Notice } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

import CardList from './components/card-list';
import CardSearch from './components/card-search';
import DeckImporter from './components/importer';

const Edit = ({ attributes, setAttributes }) => {
    const { deck = [], error = '', show_importer = false, imageLoading = {} } = attributes;
    
    // Get block props with proper className
    const blockProps = useBlockProps({
        className: 'wp-block-mtg4wp-deck'
    });

    const handleAddCard = (card) => {
        const newDeck = [...deck, card];
        setAttributes({ 
            deck: newDeck,
            imageLoading: {
                ...imageLoading,
                [newDeck.length - 1]: true
            }
        });
    };

    const handleRemoveCard = (index) => {
        const newDeck = deck.filter((_, i) => i !== index);
        const newImageLoading = { ...imageLoading };
        delete newImageLoading[index];
        setAttributes({ 
            deck: newDeck,
            imageLoading: newImageLoading
        });
    };

    const handleUpdateCard = (index, property, value) => {
        const newDeck = deck.map((card, i) =>
            i === index ? { ...card, [property]: value } : card
        );
        setAttributes({ deck: newDeck });
    };

    const handleFlipCard = (index) => {
        const newDeck = deck.map((card, i) =>
            i === index ? { ...card, current_face: card.current_face === 0 ? 1 : 0 } : card
        );
        setAttributes({ 
            deck: newDeck,
            imageLoading: {
                ...imageLoading,
                [index]: true
            }
        });
    };

    const handleSortDeck = async () => {
        try {
            setAttributes({ error: '' });
            const response = await apiFetch({
                path: '/mtg4wp/v1/deck/sort',
                method: 'POST',
                data: { cards: deck.map(card => card) },
            });
            
            setAttributes({ deck: response });
        } catch (err) {
            setAttributes({ 
                error: __('Error sorting deck.', 'l4m4w'),
            });
        }
    };

    const toggleImporter = (show) => {
        setAttributes({ show_importer: show });
    };

    return (
        <>
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title={__('Deck Settings', 'l4m4w')} initialOpen={true}>
                        <PanelRow>
                            <Button
                                variant="secondary"
                                onClick={handleSortDeck}
                                disabled={!deck.length}
                            >
                                {__('Sort Deck', 'l4m4w')}
                            </Button>
                        </PanelRow>
                    </PanelBody>
                </InspectorControls>

                <div className="mtg4wp-editor">
                    <CardSearch 
                        attributes={attributes}
                        setAttributes={setAttributes}
                        onAddCard={handleAddCard} 
                        onOpenImporter={() => toggleImporter(true)}
                    />
                    
                    {error && (
                        <Notice status="error" isDismissible={false}>
                            {error}
                        </Notice>
                    )}

                    <CardList
                        attributes={attributes}
                        setAttributes={setAttributes}
                        deck={deck}
                        onRemoveCard={handleRemoveCard}
                        onUpdateCard={handleUpdateCard}
                        onFlipCard={handleFlipCard}
                    />
                </div>

                {show_importer && (
                    <DeckImporter
                        attributes={attributes}
                        setAttributes={setAttributes}
                        onImport={(importedCards) => {
                            setAttributes({ 
                                deck: [...deck, ...importedCards],
                                show_importer: false
                            });
                        }}
                        onClose={() => toggleImporter(false)}
                    />
                )}
            </div>
        </>
    );
};

export default Edit;