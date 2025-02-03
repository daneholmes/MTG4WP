import { __ } from '@wordpress/i18n';
import {
    Button,
    Notice,
    Spinner,
    __experimentalHeading as Heading,
} from '@wordpress/components';
import { flipHorizontal } from '@wordpress/icons';
import { useState, useCallback } from '@wordpress/element';

const CardList = ({ deck = [], onRemoveCard, onUpdateCard, onFlipCard }) => {
    const [imageLoading, setImageLoading] = useState({});

    const handleImageLoad = useCallback((index) => {
        setImageLoading(prevState => ({
            ...prevState,
            [index]: false
        }));
    }, []);

    if (!deck.length) {
        return (
            <Notice status="info" isDismissible={false} className="mtg4wp-empty-notice">
                {__('Your deck is empty. Try adding some cards using the search form above.', 'mtg4wp')}
            </Notice>
        );
    }

    return (
        <div className="mtg4wp-deck-list">
            
            {deck.map((card, index) => {
                const currentFace = card.faces?.[card.currentFace];
                if (!currentFace) return null;
        
                return (
                    <div key={index} className="mtg4wp-card">
                        <div className="mtg4wp-card-layout">
                            <div className="mtg4wp-card-image-wrapper">
                                {currentFace.image && (
                                    <div className="mtg4wp-card-image-container">
                                        <img
                                            src={currentFace.image}
                                            alt={currentFace.name}
                                            className={`mtg4wp-card-img ${card.foil ? 'foil' : ''}`}
                                            onLoad={() => handleImageLoad(index)}
                                            style={{ display: imageLoading[index] ? 'none' : 'block' }}
                                        />
                                        {card.foil && <div className="foil-overlay" />}
                                        {imageLoading[index] && (
                                            <div className="mtg4wp-card-loading">
                                                <Spinner />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mtg4wp-card-details">
                                <div className="mtg4wp-card-header">
                                    <Heading level={3} className="mtg4wp-card-title">
                                        {card.name}
                                    </Heading>
                                    <Button
                                        variant="tertiary"
                                        isDestructive
                                        onClick={() => onRemoveCard(index)}
                                        className="mtg4wp-remove-button"
                                    >
                                        {__('Remove', 'mtg4wp')}
                                    </Button>
                                </div>

                                {/* Controls */}
                                <div className="mtg4wp-card-controls">
                                    {/* Quantity Control */}
                                    <div className="mtg4wp-control">
                                        <label 
                                            htmlFor={`quantity-${index}`}
                                            className="mtg4wp-control-label"
                                        >
                                            {__('Quantity', 'mtg4wp')}
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

                                    {/* Section Control */}
                                    <div className="mtg4wp-control">
                                        <label 
                                            htmlFor={`section-${index}`}
                                            className="mtg4wp-control-label"
                                        >
                                            {__('Section', 'mtg4wp')}
                                        </label>
                                        <select
                                            id={`section-${index}`}
                                            value={card.section}
                                            onChange={(e) => onUpdateCard(index, 'section', e.target.value)}
                                            className="mtg4wp-control-select"
                                        >
                                            <option value="commander">{__('Commander', 'mtg4wp')}</option>
                                            <option value="mainboard">{__('Mainboard', 'mtg4wp')}</option>
                                            <option value="sideboard">{__('Sideboard', 'mtg4wp')}</option>
                                            <option value="maybeboard">{__('Maybeboard', 'mtg4wp')}</option>
                                            <option value="token">{__('Token', 'mtg4wp')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mtg4wp-card-actions">
                                    {card.isDoubleFaced && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => onFlipCard(index)}
                                            className="mtg4wp-flip-button"
                                            icon={flipHorizontal}
                                        >
                                            {__('Flip', 'mtg4wp')}
                                        </Button>
                                    )}
                                    <label className="mtg4wp-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={card.foil}
                                            onChange={(e) => onUpdateCard(index, 'foil', e.target.checked)}
                                            className="mtg4wp-checkbox"
                                        />
                                        <span>{__('Foil', 'mtg4wp')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CardList;