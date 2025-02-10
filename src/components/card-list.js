import { __ } from '@wordpress/i18n';
import {
    Button,
    Notice,
    __experimentalHeading as Heading,
} from '@wordpress/components';
import { 
    flipHorizontal,
    flipVertical,
    rotateLeft,
    rotateRight
} from '@wordpress/icons';
import { useState, useCallback, memo } from '@wordpress/element';
import CardFace from './card-face';

// Map button icons to WordPress icons
const ICON_MAP = {
    'flip-horizontal': flipHorizontal,
    'flip-vertical': flipVertical,
    'rotate-left': rotateLeft,
    'rotate-right': rotateRight
};

/**
 * Main CardList component that renders a list of Magic: The Gathering cards
 *
 * @param {Object}   props                Component props
 * @param {Array}    props.deck           Array of card objects to display
 * @param {Function} props.onRemoveCard   Callback when a card is removed
 * @param {Function} props.onUpdateCard   Callback when a card is updated
 * @param {Function} props.onFlipCard     Callback when a card is flipped/transformed
 * @return {JSX.Element} Rendered component
 */
const CardList = ({ deck = [], onRemoveCard, onUpdateCard, onFlipCard }) => {
    const [imageLoading, setImageLoading] = useState({});

    const handleImageLoad = useCallback((index) => {
        setImageLoading(prev => ({
            ...prev,
            [index]: false
        }));
    }, []);

    if (!deck.length) {
        return (
            <Notice 
                status="info" 
                isDismissible={false} 
                className="mtg4wp-empty-notice"
            >
                {__('Your deck is empty. Try adding some cards using the search form above.', 'l4m4w')}
            </Notice>
        );
    }

    return (
        <div className="mtg4wp-deck-list">
            {deck.map((card, index) => (
                <CardListItem
                    key={`${card.id}-${index}`}
                    card={card}
                    index={index}
                    onRemoveCard={onRemoveCard}
                    onUpdateCard={onUpdateCard}
                    onFlipCard={onFlipCard}
                    onImageLoad={() => handleImageLoad(index)}
                    isLoading={imageLoading[index]}
                />
            ))}
        </div>
    );
};

/**
 * Individual card item component
 *
 * @param {Object}   props              Component props
 * @param {Object}   props.card         Card data object
 * @param {number}   props.index        Index of the card in the deck
 * @param {Function} props.onRemoveCard Callback when card is removed
 * @param {Function} props.onUpdateCard Callback when card is updated
 * @param {Function} props.onFlipCard   Callback when card is flipped/transformed
 * @param {Function} props.onImageLoad  Callback when card image loads
 * @param {boolean}  props.isLoading    Whether the card image is loading
 * @return {JSX.Element} Rendered component
 */
const CardListItem = memo(({ 
    card, 
    index, 
    onRemoveCard, 
    onUpdateCard, 
    onFlipCard,
    onImageLoad,
    isLoading 
}) => {
    const current_face = card.faces[card.current_face];
    const buttonIcon = ICON_MAP[card.buttonIcon] || flipHorizontal;

    return (
        <div className="mtg4wp-card">
            <div className="mtg4wp-card-layout">
                <CardFace
                    face={current_face}
                    isFoil={card.foil}
                    transform_type={card.transform_type}
                    display_type={card.display_type}
                    isTransformed={card.current_face > 0}
                    rotate_direction={card.rotate_direction}
                    onLoad={onImageLoad}
                    isLoading={isLoading}
                />
                
                <div className="mtg4wp-card-details">
                    <div className="mtg4wp-card-header">
                        <Heading level={3} className="mtg4wp-card-title">
                            {current_face.name || card.name}
                        </Heading>
                        <Button
                            variant="tertiary"
                            isDestructive
                            onClick={() => onRemoveCard(index)}
                            className="mtg4wp-remove-button"
                        >
                            {__('Remove', 'l4m4w')}
                        </Button>
                    </div>

                    <div className="mtg4wp-card-controls">
                        <div className="mtg4wp-control">
                            <label 
                                htmlFor={`quantity-${index}`}
                                className="mtg4wp-control-label"
                            >
                                {__('Quantity', 'l4m4w')}
                            </label>
                            <input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={card.quantity}
                                onChange={(e) => onUpdateCard(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                                className="mtg4wp-control-input"
                            />
                        </div>

                        <div className="mtg4wp-control">
                            <label 
                                htmlFor={`section-${index}`}
                                className="mtg4wp-control-label"
                            >
                                {__('Section', 'l4m4w')}
                            </label>
                            <select
                                id={`section-${index}`}
                                value={card.section}
                                onChange={(e) => onUpdateCard(index, 'section', e.target.value)}
                                className="mtg4wp-control-select"
                            >
                                <option value="commander">{__('Commander', 'l4m4w')}</option>
                                <option value="mainboard">{__('Mainboard', 'l4m4w')}</option>
                                <option value="sideboard">{__('Sideboard', 'l4m4w')}</option>
                                <option value="maybeboard">{__('Maybeboard', 'l4m4w')}</option>
                                <option value="token">{__('Token', 'l4m4w')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="mtg4wp-card-actions">
                        {card.can_transform && card.buttonText && (
                            <Button
                                variant="secondary"
                                icon={buttonIcon}
                                onClick={() => onFlipCard(index)}
                                className={`mtg4wp-transform-button ${card.buttonIcon}`}
                            >
                                {__(card.buttonText, 'l4m4w')}
                            </Button>
                        )}
                        <label className="mtg4wp-checkbox-label">
                            <input
                                type="checkbox"
                                checked={card.foil}
                                onChange={(e) => onUpdateCard(index, 'foil', e.target.checked)}
                                className="mtg4wp-checkbox"
                            />
                            <span>{__('Foil', 'l4m4w')}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CardList;