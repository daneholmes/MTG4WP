document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.mtg-tools-container').forEach((deckContainer) => {
		const defaultImageElement = deckContainer.querySelector('.mtg-tools-image-column .mtg-tools-image');
		let showingBack = false;
		let lastHoveredCard = null;

		const removeGradientOverlay = (element) => {
			const existingOverlay = element.parentNode.querySelector('.mtg-tools-gradient-overlay');
			if (existingOverlay) {
				existingOverlay.remove();
			}
		};

		const addGradientOverlay = (element) => {
			removeGradientOverlay(element);
			const overlay = document.createElement('div');
			overlay.className = 'mtg-tools-gradient-overlay';
			element.parentNode.style.position = 'relative';
			element.parentNode.appendChild(overlay);
		};

		const toggleMainImage = (card) => {
			if (defaultImageElement) {
				defaultImageElement.src = showingBack ? card.backImage : card.frontImage;
			}
		};

		deckContainer.querySelectorAll('.mtg-tools-card').forEach((cardElement) => {
			const card = {
				frontImage: cardElement.getAttribute('data-card-front-image-uri'),
				backImage: cardElement.getAttribute('data-card-back-image-uri'),
				name: cardElement.getAttribute('data-card-name') || 'Magic: The Gathering Card',
				scryfallURI: cardElement.querySelector('.mtg-tools-card-name').getAttribute('href'),
				foil: cardElement.getAttribute('data-card-foil') === 'Yes'
			};

			const flipButton = cardElement.querySelector('.mtg-tools-flip-button button');
			if (flipButton) {
				flipButton.addEventListener('click', (event) => {
					event.stopPropagation();
					showingBack = !showingBack;
					toggleMainImage(card);
				});
			}

			cardElement.addEventListener('mouseenter', () => {
				lastHoveredCard = card;
				showingBack = false;
				defaultImageElement.src = card.frontImage;
				if (card.foil) {
					addGradientOverlay(defaultImageElement);
				} else {
					removeGradientOverlay(defaultImageElement);
				}
			});
		});

		if (defaultImageElement.dataset.foil === 'Yes') {
			addGradientOverlay(defaultImageElement);
		} else {
			removeGradientOverlay(defaultImageElement);
		}

		document.addEventListener('mouseleave', () => {
			if (lastHoveredCard) {
				defaultImageElement.src = showingBack ? lastHoveredCard.backImage : lastHoveredCard.frontImage;
			}
		});
	});
});
