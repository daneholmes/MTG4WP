import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, TextControl, CheckboxControl } from '@wordpress/components';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const fetchCardDataCache = {};

export default function Edit({ attributes, setAttributes }) {
	const blockProps = useBlockProps();
	const [cards, setCards] = useState(attributes.cards || []);
	const [isLoading, setIsLoading] = useState(false);
	const debounceTimeout = useRef(null);

	const typePriority = ['Creature', 'Land', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle', 'Instant', 'Sorcery'];

	// Prioritize card types
	const prioritizeType = (types) => {
		const typeArray = types.split(' ');
		for (let type of typePriority) {
			if (typeArray.includes(type)) {
				return type;
			}
		}
		return typeArray[0] || 'Unknown';
	};

	// Function to fetch card details
	const fetchCardData = async (card, index) => {
		const cacheKey = `${card.name}-${card.set}-${card.number}`;
		if (fetchCardDataCache[cacheKey]) {
			return fetchCardDataCache[cacheKey];
		}

		let fetchUrl = '';
		if (card.set && card.number) {
			fetchUrl = `https://api.scryfall.com/cards/${encodeURIComponent(card.set)}/${encodeURIComponent(card.number)}`;
		} else {
			fetchUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card.name)}&set=${encodeURIComponent(card.set)}`;
		}

		try {
			const response = await fetch(fetchUrl);
			const data = await response.json();

			if (response.status === 200) {
				fetchCardDataCache[cacheKey] = data;
				return data;
			} else if (response.status === 404) {
				return { status: 404, message: 'Not Found' };
			}
		} catch (error) {
			// console.error(`Error fetching card data: ${error}`);
		} finally {
			setIsLoading(false);
		}
	};

	// Debounce to delay card data fetching
	const debounceFetchCardData = (card, index) => {
		clearTimeout(debounceTimeout.current);
		debounceTimeout.current = setTimeout(() => {
			setIsLoading(true);
			fetchCardData(card, index).then((data) => {
				if (data) {
					const newCards = [...cards];
					let frontImage = null;
					let backImage = null;
					let manaCost = '';
					let type = '';
					let scryfallName = card.name;

					if (data.status === 404) {
						newCards[index] = {
							...newCards[index],
							notFound: true,
						};
					} else {
						// Check card layout and set card details
						if (data.layout === 'modal_dfc' || data.layout === 'transform') {
							frontImage = data.card_faces?.[0]?.image_uris?.normal || null;
							backImage = data.card_faces?.[1]?.image_uris?.normal || null;
							manaCost = data.card_faces?.[0]?.mana_cost;
							type = data.card_faces?.[0]?.type_line;
							scryfallName = data.card_faces?.[0]?.name;
						} else if (data.layout === 'adventure') {
							frontImage = data.image_uris?.normal || null;
							manaCost = data.mana_cost;
							type = data.card_faces?.[0]?.type_line || data.type_line;
							scryfallName = data.card_faces?.[0]?.name || data.name;
						} else {
							frontImage = data.image_uris?.normal || null;
							manaCost = data.mana_cost;
							type = data.type_line;
							scryfallName = data.name;
						}

						// Clean and set the card type
						const prioritizedType = prioritizeType(type);

						// Update the card information
						newCards[index] = {
							...newCards[index],
							scryfallName,
							scryfallSet: data.set_name,
							scryfallCollectorNumber: data.collector_number,
							cmc: data.cmc,
							manaCost,
							type: prioritizedType,
							frontImage,
							backImage,
							scryfall_uri: data.scryfall_uri,
							notFound: false,
						};
					}

					setCards(newCards);
					setAttributes({ cards: newCards });
				}
			});
		}, 1000);
	};

	// Update card field values
	const updateCard = (index, key, value) => {
		const updatedCards = [...cards];
		updatedCards[index][key] = value;
		setCards(updatedCards);
		setAttributes({ cards: updatedCards });

		// Fetch updated card data when necessary fields change
		if (key === 'name' || key === 'set' || key === 'number') {
			debounceFetchCardData(updatedCards[index], index);
		}
	};

	// Add new card template
	const addCard = () => {
		const newCard = { name: '', set: '', number: '', quantity: 1, commander: false, foil: false };
		setCards([...cards, newCard]);
		setAttributes({ cards: [...cards, newCard] });
	};

	// Remove existing card
	const removeCard = (index) => {
		const updatedCards = cards.filter((_, i) => i !== index);
		setCards(updatedCards);
		setAttributes({ cards: updatedCards });
	};

	return (
		<div {...blockProps}>
			{isLoading}
			{cards.map((card, index) => (
				<div key={index} className="mtg-card">
					<div className="card-inputs">
						<TextControl
							label={__('Name', 'mtg-tools')}
							value={card.name}
							onChange={(value) => updateCard(index, 'name', value)}
						/>
						<TextControl
							label={__('Set', 'mtg-tools')}
							value={card.set}
							onChange={(value) => updateCard(index, 'set', value)}
						/>
						<TextControl
							label={__('Number', 'mtg-tools')}
							value={card.number}
							onChange={(value) => updateCard(index, 'number', value)}
						/>
						<TextControl
							label={__('Quantity', 'mtg-tools')}
							type="number"
							value={card.quantity}
							onChange={(value) => updateCard(index, 'quantity', parseInt(value))}
						/>
						<CheckboxControl
							label={__('Commander', 'mtg-tools')}
							checked={card.commander}
							onChange={(value) => updateCard(index, 'commander', value)}
						/>
						<CheckboxControl
							label={__('Foil', 'mtg-tools')}
							checked={card.foil}
							onChange={(value) => updateCard(index, 'foil', value)}
						/>
					</div>
					<div className="card-preview">
						{card.notFound ? (
							<div className="not-found">{__('Not Found', 'mtg-tools')}</div>
						) : card.frontImage ? (
							<img src={card.frontImage} alt={card.name} />
						) : (
							<div className="placeholder"></div>
						)}
					</div>
					<Button isDestructive onClick={() => removeCard(index)}>{__('Remove Card', 'mtg-tools')}</Button>
				</div>
			))}
			<Button isPrimary onClick={addCard}>{__('Add Card', 'mtg-tools')}</Button>
		</div>
	);
}
