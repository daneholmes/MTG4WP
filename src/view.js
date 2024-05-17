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
			element.parentNode.style.position = 'relative'; // Ensure the parent has position relative for absolute overlay
			element.parentNode.appendChild(overlay);
		};

		const isTouchscreenOrSmallScreen = () => {
			return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 || window.innerWidth <= 768;
		};

		const updatePopupImage = (card) => {
			const popupImageElement = document.querySelector('.mtg-tools-popup-image');
			if (popupImageElement) {
				popupImageElement.src = showingBack ? card.backImage : card.frontImage;
				if (card.foil) {
					addGradientOverlay(popupImageElement);
				} else {
					removeGradientOverlay(popupImageElement);
				}
			}
		};

		const showPopup = (card) => {
			let flipButtonHTML = '';
			if (card.backImage) {
				flipButtonHTML = `
					<button id="flip-card-button" class="wp-block-button__link wp-element-button mtg-tools-popup-flip-button">
						${showingBack ? 'Show Front' : 'Show Back'}
					</button>
				`;
			}

			Swal.fire({
				html: `
					<div class="mtg-tools-popup-content">
						<div class="mtg-tools-popup-image-wrapper">
							<img src="${showingBack ? card.backImage : card.frontImage}"
								 class="mtg-tools-popup-image"
								 alt="${card.name}">
						</div>
						${flipButtonHTML}
					</div>
				`,
				showCloseButton: true,
				showConfirmButton: false,
				background: '#fff',
				width: 'auto',
				didRender: () => {
					if (card.backImage) {
						document.getElementById('flip-card-button').addEventListener('click', () => {
							showingBack = !showingBack;
							updatePopupImage(card);  // Update the image within the existing popup
						});
					}
					const popupImageElement = document.querySelector('.mtg-tools-popup-image');
					if (card.foil) {
						addGradientOverlay(popupImageElement);
					}
				},
				showClass: {
					popup: 'animate__animated animate__fadeIn'
				},
				hideClass: {
					popup: 'animate__animated animate__fadeOut'
				}
			});
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
				if (!isTouchscreenOrSmallScreen()) {
					lastHoveredCard = card;
					showingBack = false;
					defaultImageElement.src = card.frontImage;
					if (card.foil) {
						addGradientOverlay(defaultImageElement);
					} else {
						removeGradientOverlay(defaultImageElement);
					}
				}
			});

			cardElement.addEventListener('click', (event) => {
				if (isTouchscreenOrSmallScreen()) {
					event.preventDefault();
					showingBack = false; // Start with the front image
					showPopup(card);
				} else {
					lastHoveredCard = card;
					showingBack = false; // Start with the front image
					defaultImageElement.src = card.frontImage;
					if (card.foil) {
						addGradientOverlay(defaultImageElement);
					} else {
						removeGradientOverlay(defaultImageElement);
					}
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
