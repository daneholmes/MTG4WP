import { useBlockProps } from '@wordpress/block-editor';

// Sort by CMC then alphabetically
const sortByCmcThenName = (a, b) => {
	if (a.cmc !== b.cmc) {
		return a.cmc - b.cmc;
	}
	return a.name.localeCompare(b.name);
};

// Count of unique card types
const countCardTypes = (cards) => cards.length + 1;

// Sum of all specified quantities for a group
const sumCardQuantities = (cards) => cards.reduce((sum, card) => sum + (card.quantity || 1), 0);

// Render cards in a group
const renderCardGroup = (type, cards) => {
	const groupQuantity = countCardTypes(cards);
	return cards.length > 0 ? (
		<div key={type}>
			<h2 className="has-small-font-size">{`${type} (${sumCardQuantities(cards)})`}</h2>
			<div className="mtg-tools-card-category">
				{cards.map((card, index) => (
					<div
						key={card.id || index}
						className="mtg-tools-card has-small-font-size"
						data-card-name={card.scryfallName || card.name}
						data-card-front-image-uri={card.frontImage || ''}
						data-card-back-image-uri={card.backImage || ''}
						data-card-foil={card.foil ? 'Yes' : 'No'}
					>
						<span className="mtg-tools-quantity">{card.quantity || 1}</span>
						<div className="mtg-tools-card-wrapper">
							<div className="mtg-tools-tooltip-wrapper">
								<p className="mtg-tools-card-name mtg-tooltip" data-tippy-content={`<div class="mtg-tools-tooltip-content">
									<img src="${card.frontImage || ''}" alt="${card.scryfallName || card.name}" class="mtg-tools-tooltip-image" data-front-image="${card.frontImage}" data-back-image="${card.backImage || ''}"/>
									${card.backImage ? `<button class="mtg-tools-toggle-image">Show Back</button>` : ''}
								</div>`}>
									{card.scryfallName || card.name}
								</p>
								{card.backImage && (
									<div className="mtg-tools-flip-button">
										<button className="mtg-tools-flip dashicons dashicons-image-rotate" type="button"></button>
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	) : null;
};

export default function save({ attributes }) {
	const blockProps = useBlockProps.save();
	const { cards = [] } = attributes;

	// Identify and sort commanders
	const commanderCards = cards.filter((card) => card.commander).sort(sortByCmcThenName);

	// Define groups
	const typePriority = [
		{ type: 'Artifacts', condition: (card) => card.type === 'Artifact' && !card.commander },
		{ type: 'Battles', condition: (card) => card.type === 'Battle' && !card.commander },
		{ type: 'Creatures', condition: (card) => card.type === 'Creature' && !card.commander },
		{ type: 'Planeswalkers', condition: (card) => card.type === 'Planeswalker' && !card.commander },
		{ type: 'Enchantments', condition: (card) => card.type === 'Enchantment' && !card.commander },
		{ type: 'Instants', condition: (card) => card.type === 'Instant' && !card.commander },
		{ type: 'Sorceries', condition: (card) => card.type === 'Sorcery' && !card.commander },
		{ type: 'Lands', condition: (card) => card.type === 'Land' && !card.commander },
	];

	// Sort groups
	const groupedCards = typePriority.reduce((acc, group) => {
		acc[group.type] = cards.filter(group.condition).sort(sortByCmcThenName);
		return acc;
	}, {});

	// Add commander to start of groups
	const allGroups = {
		Commander: commanderCards,
		...groupedCards,
	};

	// Divide unique cards in half
	const totalCardCount = Object.values(allGroups).reduce((total, group) => total + countCardTypes(group), 0);
	const halfwayMark = Math.ceil(totalCardCount / 2);

	// Divide groups into two columns
	let leftGroups = {};
	let rightGroups = {};
	let currentCardCount = 0;

	for (const [type, group] of Object.entries(allGroups)) {
		const groupUniqueCount = countCardTypes(group);

		if (currentCardCount + groupUniqueCount <= halfwayMark || Object.keys(leftGroups).length === 0) {
			leftGroups[type] = group;
			currentCardCount += groupUniqueCount;
		} else {
			rightGroups[type] = group;
		}
	}

	// Get the default image
	const defaultCard = commanderCards[0] || Object.values(groupedCards).flat()[0];
	const defaultImage = defaultCard?.frontImage;
	const defaultAltText = defaultCard?.scryfallName || 'Magic: The Gathering Card';
	const defaultFoil = defaultCard?.foil ? 'Yes' : 'No';

	return (
		<div {...blockProps} className="mtg-tools-container">
			<div className="mtg-tools-column mtg-tools-image-column">
				<div className="mtg-tools-sticky">
					<img
						id="mtg-tools-default-image"
						src={defaultImage}
						alt={defaultAltText}
						className="mtg-tools-image"
						data-foil={defaultFoil}
					/>
					{defaultCard?.foil && (
						<div className="mtg-tools-gradient-overlay"></div>
					)}
				</div>

			</div>

			<div className="mtg-tools-column">
				{Object.entries(leftGroups).map(([type, cards]) => renderCardGroup(type, cards))}
			</div>

			<div className="mtg-tools-column">
				{Object.entries(rightGroups).map(([type, cards]) => renderCardGroup(type, cards))}
			</div>
		</div>
	);
}
