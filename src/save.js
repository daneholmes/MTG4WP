import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

const Save = ({ attributes }) => {
    const blockProps = useBlockProps.save();
    const { deck } = attributes;

    // Group cards by section
    const groupedCards = deck.reduce((acc, card) => {
        if (!acc[card.section]) {
            acc[card.section] = [];
        }
        acc[card.section].push(card);
        return acc;
    }, {});

    // Order sections
    const sectionOrder = ['commander', 'mainboard', 'sideboard', 'maybeboard', 'token'];

    return (
        <div {...blockProps}>
            <div className="mtg4wp-deck">
                {sectionOrder.map((section) => {
                    if (!groupedCards[section]?.length) {
                        return null;
                    }

                    return (
                        <div key={section} className={`mtg4wp-section mtg4wp-section-${section}`}>
                            <h3 className="mtg4wp-section-title">
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                            </h3>
                            <div className="mtg4wp-card-list">
                                {groupedCards[section].map((card, index) => (
                                    <div 
                                        key={`${card.id}-${index}`} 
                                        className="mtg4wp-card" 
                                        data-card-id={card.id}
                                        data-card-name={card.name}
                                        data-card-set={card.set}
                                        data-card-number={card.collector_number}
                                        data-card-foil={card.foil ? 'true' : 'false'}
                                    >
                                        <span className="mtg4wp-card-quantity">{card.quantity}x</span>
                                        <span className="mtg4wp-card-name">{card.name}</span>
                                        {card.foil && (
                                            <span className="mtg4wp-card-foil">
                                                {__('*F*', 'mtg4wp')}
                                            </span>
                                        )}
                                        <span className="mtg4wp-card-set">
                                            ({card.set.toUpperCase()})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Save;