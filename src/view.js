document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.mtg-tools-container').forEach((deckContainer) => {
		const defaultImageElement = deckContainer.querySelector('.mtg-tools-image-column .mtg-tools-image');
		let showingBack = false;
		let lastHoveredCard = null;

		const removeGradientOverlay = () => {
			const existingOverlay = defaultImageElement.nextElementSibling;
			if (existingOverlay && existingOverlay.classList.contains('mtg-tools-gradient-overlay')) {
				existingOverlay.remove();
			}
		};

		const addGradientOverlay = (element) => {
			removeGradientOverlay();
			const overlay = document.createElement('div');
			overlay.className = 'mtg-tools-gradient-overlay';
			element.parentNode.appendChild(overlay);
		};

		const isTouchscreenOrSmallScreen = () => {
			return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 || window.innerWidth <= 768;
		};

		const showPopup = (card) => {
			let flipButtonHTML = '';
			if (card.backImage) {
				flipButtonHTML = `
					<button id="flip-card-button" class="swal2-confirm swal2-styled" style="display: inline-block; margin-top: 10px;">
						${showingBack ? 'Show Front' : 'Show Back'}
					</button>
				`;
			}

			Swal.fire({
				html: `
					<img src="${showingBack ? card.backImage : card.frontImage}"
						 class="mtg-tools-popup-image"
						 style="width: 100%; height: auto;"
						 alt="${card.name}">
					<p><a href="${card.scryfallURI}" target="_blank">View ${card.name} on Scryfall</a></p>
					${flipButtonHTML}
				`,
				showCloseButton: true,
				showConfirmButton: false,
				background: '#fff',
				width: 'auto',
				customClass: {
					popup: 'wordpress-default-popup',
				},
				didRender: () => {
					if (card.backImage) {
						document.getElementById('flip-card-button').addEventListener('click', () => {
							showingBack = !showingBack;
							showPopup(card);  // Show the popup with the flipped image
						});
					}
					if (card.foil) {
						addGradientOverlay(document.querySelector('.swal2-image'));
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
					showingBack = false; // Ensure we start with the front image
					defaultImageElement.src = card.frontImage;
					if (card.foil) {
						addGradientOverlay(defaultImageElement);
					} else {
						removeGradientOverlay();
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
						removeGradientOverlay();
					}
				}
			});
		});

		if (defaultImageElement.dataset.foil === 'Yes') {
			addGradientOverlay(defaultImageElement);
		} else {
			removeGradientOverlay();
		}

		document.addEventListener('mouseleave', () => {
			if (lastHoveredCard) {
				defaultImageElement.src = showingBack ? lastHoveredCard.backImage : lastHoveredCard.frontImage;
			}
		});
	});
});
