import { useBlockProps } from '@wordpress/block-editor';

const Save = ({ attributes }) => {
    const { deck = [] } = attributes;
    
    const blockProps = useBlockProps.save({
        className: 'wp-block-mtg4wp-deck'
    });

    // Find default card to display
    const getDefaultCard = () => {
        const commander = deck.find(card => card.section === 'commander');
        if (commander) return commander;

        const mainboardCards = deck.filter(card => card.section === 'mainboard');
        if (!mainboardCards.length) return deck[0];

        const rarityOrder = ['mythic', 'rare', 'uncommon', 'common', 'basic'];
        const byRarity = mainboardCards.reduce((acc, card) => {
            acc[card.rarity] = acc[card.rarity] || [];
            acc[card.rarity].push(card);
            return acc;
        }, {});

        const highestRarity = rarityOrder.find(rarity => byRarity[rarity]?.length);
        if (!highestRarity) return mainboardCards[0];

        const rarestCards = byRarity[highestRarity];
        const maxQuantity = Math.max(...rarestCards.map(card => card.quantity));
        const highestQuantityCards = rarestCards.filter(card => card.quantity === maxQuantity);

        return highestQuantityCards.reduce((acc, card) => 
            (card.cmc > acc.cmc) ? card : acc, highestQuantityCards[0]);
    };

    // Organize cards by section and type
    const organizeCards = () => {
        const organized = {
            commander: [],
            mainboard: {
                creature: [],
                planeswalker: [],
                artifact: [],
                battle: [],
                enchantment: [],
                instant: [],
                sorcery: [],
                land: [],
                other: []
            },
            sideboard: [],
            maybeboard: [],
            token: []
        };

        deck.forEach(card => {
            if (card.section === 'mainboard') {
                // Use primary_type from the backend
                const type = card.primary_type || 'other';
                if (organized.mainboard[type]) {
                    organized.mainboard[type].push(card);
                } else {
                    organized.mainboard.other.push(card);
                }
            } else if (organized[card.section]) {
                organized[card.section].push(card);
            }
        });

        // Sort each section by CMC
        Object.keys(organized.mainboard).forEach(type => {
            organized.mainboard[type].sort((a, b) => a.cmc - b.cmc);
        });
        ['sideboard', 'maybeboard', 'token'].forEach(section => {
            organized[section].sort((a, b) => a.cmc - b.cmc);
        });

        return organized;
    };

    const organized = organizeCards();
    const defaultCard = getDefaultCard();

    // Only include sections that have cards
    const mainboardTypes = Object.entries(organized.mainboard)
        .filter(([_, cards]) => cards.length > 0);

    return (
        <div {...blockProps}>
            <div className="wp-block-mtg4wp-preview" data-default-card={JSON.stringify(defaultCard)}>
                {/* Will be populated by view.js */}
            </div>

            <div className="wp-block-mtg4wp-sections">
                {organized.commander.length > 0 && (
                    <div className="wp-block-mtg4wp-section" data-section-type="commander">
                        <h3>Commander</h3>
                        {organized.commander.map((card, index) => (
                            <div 
                                key={`${card.id}-${index}`}
                                className="wp-block-mtg4wp-card"
                                data-card={JSON.stringify(card)}
                            >
                                <span className="quantity">{card.quantity}</span>
                                {card.name}
                                {card.isDoubleFaced && (
                                    <button 
                                        type="button" 
                                        className="flip-button" 
                                        aria-label={`Flip ${card.name}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {mainboardTypes.map(([type, cards]) => (
                    <div 
                        key={type} 
                        className="wp-block-mtg4wp-section"
                        data-section-type={type}
                    >
                        <h3>{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
                        {cards.map((card, index) => (
                            <div 
                                key={`${card.id}-${index}`}
                                className="wp-block-mtg4wp-card"
                                data-card={JSON.stringify(card)}
                            >
                                <span className="quantity">{card.quantity}</span>
                                {card.name}
                                {card.isDoubleFaced && (
                                    <button 
                                        type="button" 
                                        className="flip-button" 
                                        aria-label={`Flip ${card.name}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {['sideboard', 'maybeboard', 'token'].map(section => 
                    organized[section].length > 0 && (
                        <div 
                            key={section} 
                            className="wp-block-mtg4wp-section" 
                            data-section-type={section}
                        >
                            <h3>{section.charAt(0).toUpperCase() + section.slice(1)}</h3>
                            {organized[section].map((card, index) => (
                                <div 
                                    key={`${card.id}-${index}`}
                                    className="wp-block-mtg4wp-card"
                                    data-card={JSON.stringify(card)}
                                >
                                    <span className="quantity">{card.quantity}</span>
                                    {card.name}
                                    {card.isDoubleFaced && (
                                        <button 
                                            type="button" 
                                            className="flip-button" 
                                            aria-label={`Flip ${card.name}`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Save;