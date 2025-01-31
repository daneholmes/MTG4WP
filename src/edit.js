import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import {
    useState,
    createInterpolateElement
} from '@wordpress/element';
import {
    TextControl,
    ExternalLink,
    Button,
    SelectControl,
    PanelBody,
    PanelRow,
    ToggleControl,
    Card,
    CardBody,
    Spinner,
    __experimentalNumberControl as NumberControl,
    Notice,
    __experimentalHeading as Heading
} from '@wordpress/components';
import { flipHorizontal } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import DeckImporter from './components/importer';

const Edit = ({ attributes, setAttributes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSet, setSearchSet] = useState('');
    const [searchNumber, setSearchNumber] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [imageLoading, setImageLoading] = useState({});
    const [showImporter, setShowImporter] = useState(false);
    const { deck } = attributes;

    const searchCard = async () => {
        setSearching(true);
        setError('');
        
        try {
            const response = await apiFetch({
                path: '/wp/v2/mtg4wp/search',
                method: 'POST',
                data: {
                    card_name: searchTerm || '',
                    set: searchSet || undefined,
                    number: searchNumber || undefined
                }
            });

            if (!response || !response.faces || !response.faces.length) {
                throw new Error('Card not found');
            }
            
            const isValidCard = response.id && 
                              response.name && 
                              response.faces[0] && 
                              response.faces[0].name &&
                              response.faces[0].type_line;
            
            if (!isValidCard) {
                throw new Error('Invalid card data received');
            }
            
            setAttributes({
                deck: [...deck, response]
            });
            
            setSearchTerm('');
            setSearchSet('');
            setSearchNumber('');
        } catch (err) {
            setError(
                err.message === 'Card not found' 
                    ? __('Card not found. Please verify the card name, set code, or collector number.', 'mtg4wp')
                    : __('Error finding card. Please try again.', 'mtg4wp')
            );
            console.error('MTG4WP Error:', err);
        } finally {
            setSearching(false);
        }
    };

    const removeCard = (index) => {
        const newDeck = [...deck];
        newDeck.splice(index, 1);
        setAttributes({ deck: newDeck });
        
        setImageLoading(prev => {
            const updated = { ...prev };
            delete updated[index];
            const reindexed = {};
            Object.keys(updated).forEach(key => {
                const numKey = parseInt(key);
                if (numKey > index) {
                    reindexed[numKey - 1] = updated[key];
                } else {
                    reindexed[key] = updated[key];
                }
            });
            return reindexed;
        });
    };

    const updateCardProperty = (index, property, value) => {
        const newDeck = [...deck];
        newDeck[index] = {
            ...newDeck[index],
            [property]: value
        };
        setAttributes({ deck: newDeck });
    };

    const flipCard = (index) => {
        const newDeck = [...deck];
        const card = newDeck[index];
        card.currentFace = card.currentFace === 0 ? 1 : 0;
        setAttributes({ deck: newDeck });
    };

    const getCurrentFace = (card) => {
        if (!card.faces || !card.faces.length) return null;
        return card.faces[card.currentFace] || card.faces[0];
    };

    const sortDeck = async () => {
        try {
            const sortedDeck = await apiFetch({
                path: '/wp/v2/mtg4wp/sort',
                method: 'POST',
                data: {
                    cards: deck.map(card => ({
                        ...card,
                        type_line: card.faces?.[0]?.type_line || '',
                        cmc: card.faces?.[0]?.cmc || 0
                    })),
                    sort_by: 'name'
                }
            });
            setAttributes({ deck: sortedDeck });
        } catch (err) {
            setError(__('Error sorting deck. Please try again.', 'mtg4wp'));
        }
    };

    const blockProps = useBlockProps();

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody title={__('Deck Settings', 'mtg4wp')} initialOpen={true}>
                    <PanelRow>
                        <Button 
                            variant="secondary"
                            onClick={sortDeck}
                            disabled={!deck.length}
                        >
                            {__('Sort Deck', 'mtg4wp')}
                        </Button>
                    </PanelRow>
                </PanelBody>
            </InspectorControls>

            <div className="mtg4wp-editor">
                <div className="mtg4wp-search">
                <Heading level="2">Add Cards</Heading>
                    <TextControl
                        label={__('Card Name', 'mtg4wp')}
                        value={searchTerm}
                        onChange={setSearchTerm}
                        help={__('e.g. Brainstorm, Chromatic Star, Plains', 'mtg4wp')}
                        __nextHasNoMarginBottom={false}
                    />
                    <TextControl
                        label={__('Set Code', 'mtg4wp')}
                        value={searchSet}
                        onChange={setSearchSet}
                        help={createInterpolateElement(
                            __('See the list of valid <a>set codes</a>', 'mtg4wp'),
                            {
                                a: (
                                    <ExternalLink href="https://scryfall.com/sets?lang=en">
                                    </ExternalLink>
                                )
                            }
                        )}
                        __nextHasNoMarginBottom={false}
                    />
                    <TextControl
                        label={__('Collector Number', 'mtg4wp')}
                        value={searchNumber}
                        onChange={setSearchNumber}
                        help={__('e.g. 61, 11, 417', 'mtg4wp')}
                        __nextHasNoMarginBottom={false}
                    />
                    <div className="mtg4wp-search-buttons">
                        <Button 
                            variant="primary"
                            onClick={searchCard}
                            isBusy={searching}
                            disabled={searching || (!searchTerm && (!searchSet || !searchNumber))}
                        >
                            {__('Add Card', 'mtg4wp')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowImporter(true)}
                        >
                            {__('Import Deck', 'mtg4wp')}
                        </Button>
                    </div>
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

                <div className="mtg4wp-deck-list">
                    {deck.length === 0 && (
                        <Notice 
                            status="info" 
                            isDismissible={false}
                            className="mtg4wp-empty-notice"
                        >
                            {__('Your deck is empty. Try adding some cards using the search form above.', 'mtg4wp')}
                        </Notice>
                    )}
                    {deck.map((card, index) => {
                        const currentFace = getCurrentFace(card);
                        if (!currentFace) return null;
                        
                        return (
                            <Card key={index} className="mtg4wp-card">
                                <CardBody>
                                    <div className="mtg4wp-card-layout">
                                        <div className="mtg4wp-card-image">
                                            {currentFace.image && (
                                                <>
                                                    <div className="mtg4wp-card-container">
                                                        <img 
                                                            src={currentFace.image}
                                                            alt={currentFace.name}
                                                            width="146" 
                                                            height="204"
                                                            className={`mtg4wp-card-img ${card.foil ? 'foil' : ''}`}
                                                            onLoad={() => setImageLoading(prev => ({...prev, [index]: false}))}
                                                            style={{ display: imageLoading[index] ? 'none' : 'block' }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                setError(__('Error loading card image. Please try again.', 'mtg4wp'));
                                                            }}
                                                        />
                                                        {card.foil && <div className="foil-overlay" />}
                                                    </div>
                                                    {imageLoading[index] && (
                                                        <div className="mtg4wp-card-loading">
                                                            <Spinner />
                                                        </div>
                                                    )}
                                                    {card.isDoubleFaced && (
                                                        <Button
                                                            variant="primary"
                                                            className="mtg4wp-card-flip"
                                                            onClick={() => flipCard(index)}
                                                        >
                                                            <span className="mtg4wp-flip-icon">{flipHorizontal}</span>
                                                            <span>{__('Flip', 'mtg4wp')}</span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="mtg4wp-card-content">
                                            <div className="mtg4wp-card-header">
                                                <Heading level="4">{card.name}</Heading>
                                                <Button
                                                    variant="secondary"
                                                    isDestructive
                                                    onClick={() => removeCard(index)}
                                                >
                                                    {__('Remove', 'mtg4wp')}
                                                </Button>
                                            </div>
                                            <div className="mtg4wp-card-controls">
                                                <NumberControl
                                                    label={__('Quantity', 'mtg4wp')}
                                                    value={card.quantity}
                                                    onChange={(value) => updateCardProperty(index, 'quantity', parseInt(value) || 1)}
                                                    min={1}
                                                />
                                                <SelectControl
                                                    label={__('Section', 'mtg4wp')}
                                                    value={card.section}
                                                    options={[
                                                        { label: 'Commander', value: 'commander' },
                                                        { label: 'Mainboard', value: 'mainboard' },
                                                        { label: 'Sideboard', value: 'sideboard' },
                                                        { label: 'Maybeboard', value: 'maybeboard' },
                                                        { label: 'Token', value: 'token' }
                                                    ]}
                                                    onChange={(value) => updateCardProperty(index, 'section', value)}
                                                    __nextHasNoMarginBottom={false}
                                                />
                                                <ToggleControl
                                                    label={__('Foil', 'mtg4wp')}
                                                    checked={card.foil}
                                                    onChange={(value) => updateCardProperty(index, 'foil', value)}
                                                    __nextHasNoMarginBottom={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {showImporter && (
                <DeckImporter
                    onImport={(importedCards) => {
                        setAttributes({
                            deck: [...deck, ...importedCards]
                        });
                    }}
                    onClose={() => setShowImporter(false)}
                />
            )}
        </div>
    );
};

export default Edit;