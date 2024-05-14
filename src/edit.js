import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { Button, TextControl, CheckboxControl, Spinner } from '@wordpress/components';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export default function Edit({ attributes, setAttributes }) {
	const blockProps = useBlockProps();
	const [cards, setCards] = useState(attributes.cards || []);
	const [isLoading, setIsLoading] = useState(false);
	const fetchCycle = useRef(0);
	const debounceTimeout = useRef(null);

	const typePriority = ['Creature', 'Land', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle', 'Instant', 'Sorcery'];

	// Function to prioritize card types
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
		let fetchUrl = '';
		if (card.set && card.number) {
			fetchUrl = `https://api.scryfall.com/cards/${encodeURIComponent(card.set)}/${encodeURIComponent(card.number)}`;
		} else {
			fetchUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card.name)}&set=${encodeURIComponent(card.set)}`;
		}

		try {
			const response = await fetch(fetchUrl);
			const data = await response.json();

			if (!data.status) {
				const newCards = [...cards];
				let frontImage = null;
				let backImage = null;
				let manaCost = '';
				let type = '';
				let scryfallName = card.name;

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
				};

				setCards(newCards);
				setAttributes({ cards: newCards });
			}
		} catch (error) {
			console.error(`Error fetching card data: ${error}`);
		}
	};

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const fetchCardsData = useCallback(async () => {
		setIsLoading(true);
		const currentFetchCycle = fetchCycle.current;
		for (let i = 0; i < cards.length; i++) {
			if (fetchCycle.current !== currentFetchCycle) return; // Abort if fetch cycle has been invalidated
			await fetchCardData(cards[i], i);
			await delay(50); // Add a 50ms delay between each API call
		}
		setIsLoading(false);
	}, [cards]);

	useEffect(() => {
		fetchCycle.current++;
		fetchCardsData();
	}, [cards, fetchCardsData]);

	// Limit the rate of updating
	const debounceUpdate = (callback, delay) => {
		return (...args) => {
			clearTimeout(debounceTimeout.current);
			debounceTimeout.current = setTimeout(() => {
				callback(...args);
			}, delay);
		};
	};

	// Update card field values
	const updateCard = (index, key, value) => {
		const updatedCards = [...cards];
		updatedCards[index][key] = value;
		setCards(updatedCards);
		setAttributes({ cards: updatedCards });
	};

	const debouncedUpdateCard = useCallback(debounceUpdate(updateCard, 300), [cards]);

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
			{isLoading && <Spinner />}
			{cards.map((card, index) => (
				<div key={index} className="mtg-card">
					<TextControl
						label={__('Name', 'mtg-tools')}
						value={card.name}
						onChange={(value) => debouncedUpdateCard(index, 'name', value)}
					/>
					<TextControl
						label={__('Set', 'mtg-tools')}
						value={card.set}
						onChange={(value) => debouncedUpdateCard(index, 'set', value)}
					/>
					<TextControl
						label={__('Number', 'mtg-tools')}
						value={card.number}
						onChange={(value) => debouncedUpdateCard(index, 'number', value)}
					/>
					<TextControl
						label={__('Quantity', 'mtg-tools')}
						type="number"
						value={card.quantity}
						onChange={(value) => debouncedUpdateCard(index, 'quantity', parseInt(value))}
					/>
					<CheckboxControl
						label={__('Commander', 'mtg-tools')}
						checked={card.commander}
						onChange={(value) => debouncedUpdateCard(index, 'commander', value)}
					/>
					<CheckboxControl
						label={__('Foil', 'mtg-tools')}
						checked={card.foil}
						onChange={(value) => debouncedUpdateCard(index, 'foil', value)}
					/>
					<Button isDestructive onClick={() => removeCard(index)}>{__('Remove Card', 'mtg-tools')}</Button>
				</div>
			))}
			<Button isPrimary onClick={addCard}>{__('Add Card', 'mtg-tools')}</Button>
		</div>
	);
}
