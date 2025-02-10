import { flipHorizontal } from '@wordpress/icons';
import { Tooltip } from '@wordpress/components';

document.addEventListener('DOMContentLoaded', () => {
    class DeckViewer {
        constructor(deckElement) {
            this.deck = deckElement;
            this.previewColumn = deckElement.querySelector('.wp-block-mtg4wp-preview');
            this.cards = deckElement.querySelectorAll('.wp-block-mtg4wp-card');
            this.defaultCard = this.previewColumn?.dataset.defaultCard 
                ? JSON.parse(this.previewColumn.dataset.defaultCard) 
                : null;
            this.currentCard = this.defaultCard;
            this.isMobile = window.matchMedia('(max-width: 781px)').matches;
            this.tooltipInstance = null;

            this.initialize();
        }

        initialize() {
            // Set up initial preview
            if (!this.isMobile && this.previewColumn && this.defaultCard) {
                this.updatePreview(this.defaultCard);
            }

            // Set up card interactions
            this.cards.forEach(card => {
                if (this.isMobile) {
                    card.addEventListener('click', (e) => this.handleCardClick(e, card));
                } else {
                    card.addEventListener('mouseenter', () => this.handleCardHover(card));
                }

                // Set up flip buttons if present
                const flipButton = card.querySelector('.flip-button');
                if (flipButton) {
                    flipButton.addEventListener('click', (e) => this.handleFlip(e, card));
                    // Add flip icon
                    flipButton.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">${flipHorizontal.path}</svg>`;
                }
            });

            // Set up sticky preview on desktop
            if (!this.isMobile && this.previewColumn) {
                this.setupStickyPreview();
            }
        }

        updatePreview(cardData, faceIndex = 0) {
            if (!this.previewColumn) return;

            const face = cardData.faces[faceIndex];
            if (!face) return;

            this.previewColumn.innerHTML = `
                <div class="card-image-wrapper">
                    <img 
                        src="${face.image}" 
                        alt="${face.name}" 
                        class="card-image"
                    />
                </div>
            `;
        }

        handleCardHover(cardElement) {
            const cardData = JSON.parse(cardElement.dataset.card);
            this.currentCard = cardData;
            this.updatePreview(cardData);
        }

        handleCardClick(event, cardElement) {
            // Prevent click if it's on the flip button
            if (event.target.closest('.flip-button')) return;

            const cardData = JSON.parse(cardElement.dataset.card);
            
            // Create tooltip content
            const tooltipContent = document.createElement('div');
            tooltipContent.className = 'mtg4wp-tooltip-content';
            tooltipContent.innerHTML = `
                <div class="card-image-wrapper">
                    <img 
                        src="${cardData.faces[0].image}" 
                        alt="${cardData.name}" 
                        class="card-image"
                    />
                    ${cardData.isDoubleFaced ? `
                        <button 
                            type="button" 
                            class="flip-button-mobile"
                            aria-label="Flip ${cardData.name}"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24">${flipHorizontal.path}</svg>
                        </button>
                    ` : ''}
                    <button type="button" class="close-button" aria-label="Close">×</button>
                </div>
            `;

            // Create and show tooltip
            const tooltip = new Tooltip({
                target: cardElement,
                content: tooltipContent,
                position: 'top',
                className: 'mtg4wp-tooltip',
                onClose: () => {
                    this.tooltipInstance = null;
                }
            });

            // Store reference to current tooltip
            this.tooltipInstance = tooltip;

            // Set up flip button handler for mobile
            const flipButton = tooltipContent.querySelector('.flip-button-mobile');
            if (flipButton) {
                let current_face = 0;
                flipButton.addEventListener('click', () => {
                    current_face = current_face === 0 ? 1 : 0;
                    const img = tooltipContent.querySelector('img');
                    img.src = cardData.faces[current_face].image;
                });
            }

            // Set up close button
            const closeButton = tooltipContent.querySelector('.close-button');
            closeButton.addEventListener('click', () => {
                tooltip.remove();
                this.tooltipInstance = null;
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!tooltipContent.contains(e.target) && this.tooltipInstance) {
                    tooltip.remove();
                    this.tooltipInstance = null;
                }
            });
        }

        handleFlip(event, cardElement) {
            event.stopPropagation();
            
            const cardData = JSON.parse(cardElement.dataset.card);
            const currentSrc = this.previewColumn.querySelector('img').src;
            const current_faceIndex = cardData.faces.findIndex(face => face.image === currentSrc);
            const nextFaceIndex = current_faceIndex === 0 ? 1 : 0;
            
            this.updatePreview(cardData, nextFaceIndex);
        }

        setupStickyPreview() {
            if (!this.previewColumn) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    this.previewColumn.classList.toggle('is-sticky', entry.intersectionRatio < 1);
                },
                { threshold: [1] }
            );

            observer.observe(this.previewColumn);
        }
    }

    // Initialize all deck viewers on the page
    document.querySelectorAll('.wp-block-mtg4wp-deck').forEach(deck => {
        new DeckViewer(deck);
    });
});