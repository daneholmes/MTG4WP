import { useBlockProps } from '@wordpress/block-editor';

const Save = ({ attributes }) => {
    const blockProps = useBlockProps.save();
    const { deck } = attributes;

    return (
        <div {...blockProps}>
            <div className="mtg4wp-deck">
                {deck.map((card, index) => (
                    <div key={index} className="mtg4wp-card" data-card-name={card.name}>
                        {card.quantity}x {card.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Save;