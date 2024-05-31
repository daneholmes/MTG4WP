/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/view.js":
/*!*********************!*\
  !*** ./src/view.js ***!
  \*********************/
/***/ (function() {

document.addEventListener('DOMContentLoaded', () => {
  let tooltipInstances = [];
  const initializeTooltips = () => {
    // Destroy existing tooltip instances
    tooltipInstances.forEach(instance => instance.destroy());
    tooltipInstances = [];

    // Tippy.js tooltips initialization for touchscreens and small screens
    const isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    if (isTouchScreen || isSmallScreen) {
      const cardNameElements = document.querySelectorAll('.mtg-tools-card-name');
      cardNameElements.forEach(cardNameElement => {
        const cardElement = cardNameElement.closest('.mtg-tools-card');
        const cardFrontImage = cardElement.getAttribute('data-card-front-image-uri');
        const cardBackImage = cardElement.getAttribute('data-card-back-image-uri');
        const cardName = cardElement.getAttribute('data-card-name') || 'Magic: The Gathering Card';
        const isFoil = cardElement.getAttribute('data-card-foil') === 'Yes';
        let showingBack = false;
        const tooltipContent = document.createElement('div');
        tooltipContent.innerHTML = `
					<div class="tooltip-card-wrapper">
						<div class="tooltip-image-wrapper">
							<img src="${cardFrontImage}" alt="${cardName}" class="tooltip-card-image">
							${isFoil ? '<div class="tooltip-gradient-overlay"></div>' : ''}
						</div>
						${cardBackImage ? `<button class="tooltip-flip-button wp-element-button">Show Back</button>` : ''}
					</div>
				`;
        if (cardBackImage) {
          const flipButton = tooltipContent.querySelector('.tooltip-flip-button');
          flipButton.addEventListener('click', () => {
            const imgElement = tooltipContent.querySelector('.tooltip-card-image');
            showingBack = !showingBack;
            imgElement.src = showingBack ? cardBackImage : cardFrontImage;
            flipButton.textContent = showingBack ? 'Show Front' : 'Show Back';
          });
        }
        const instance = tippy(cardNameElement, {
          content: tooltipContent,
          allowHTML: true,
          interactive: true,
          placement: 'bottom',
          followCursor: 'horizontal'
        });
        tooltipInstances.push(instance);
      });
    }
  };
  const setupDeckContainer = deckContainer => {
    const defaultImageElement = deckContainer.querySelector('.mtg-tools-image-column .mtg-tools-image');
    let showingBack = false;
    let lastHoveredCard = null;
    const removeGradientOverlay = element => {
      const existingOverlay = element.parentNode.querySelector('.mtg-tools-gradient-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    };
    const addGradientOverlay = element => {
      removeGradientOverlay(element);
      const overlay = document.createElement('div');
      overlay.className = 'mtg-tools-gradient-overlay';
      element.parentNode.style.position = 'relative';
      element.parentNode.appendChild(overlay);
    };
    const toggleMainImage = card => {
      if (defaultImageElement) {
        defaultImageElement.src = showingBack ? card.backImage : card.frontImage;
      }
    };
    deckContainer.querySelectorAll('.mtg-tools-card').forEach(cardElement => {
      const card = {
        frontImage: cardElement.getAttribute('data-card-front-image-uri'),
        backImage: cardElement.getAttribute('data-card-back-image-uri'),
        name: cardElement.getAttribute('data-card-name') || 'Magic: The Gathering Card',
        scryfallURI: cardElement.querySelector('.mtg-tools-card-name').getAttribute('href'),
        foil: cardElement.getAttribute('data-card-foil') === 'Yes'
      };
      const flipButton = cardElement.querySelector('.mtg-tools-flip-button button');
      if (flipButton) {
        flipButton.addEventListener('click', event => {
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
  };
  document.querySelectorAll('.mtg-tools-container').forEach(deckContainer => {
    setupDeckContainer(deckContainer);
  });
  initializeTooltips();
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  };
  const handleResize = debounce(() => {
    const isSmallScreen = window.innerWidth < 768;
    const tooltipsActive = tooltipInstances.length > 0;
    if (isSmallScreen && !tooltipsActive || !isSmallScreen && tooltipsActive) {
      initializeTooltips();
    }
  }, 300); // Debounce interval

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(document.body);

  // Fallback for ResizeObserver edge cases
  window.addEventListener('resize', handleResize);
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/view.js"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=view.js.map