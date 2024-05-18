document.addEventListener('DOMContentLoaded', function () {
	// Function to initialize tooltips
	function initializeTooltips(selector) {
		tippy(selector, {
			allowHTML: true,
			interactive: true,
			placement: 'bottom',
			followCursor: 'horizontal',
			onShown(instance) {
				const tooltip = instance.popper;
				const tooltipImage = tooltip.querySelector('.mtg-tools-tooltip-image');
				const toggleButton = tooltip.querySelector('.mtg-tools-toggle-image');

				if (toggleButton) {
					const frontImage = tooltipImage.getAttribute('data-front-image');
					const backImage = tooltipImage.getAttribute('data-back-image');

					// Handle button click to toggle images and swap button text
					toggleButton.addEventListener('click', () => {
						if (tooltipImage.src === frontImage) {
							tooltipImage.src = backImage;
							toggleButton.innerText = 'Show Front';
						} else {
							tooltipImage.src = frontImage;
							toggleButton.innerText = 'Show Back';
						}
					});
				}
			},
		});
	}

	// Function to check if the device supports touch or the screen width is less than 755px
	function shouldShowTooltips() {
		return 'ontouchstart' in document.documentElement || window.innerWidth < 755;
	}

	// Function to apply or remove specific tooltips based on conditions
	function applyTooltips() {
		const allTooltips = document.querySelectorAll('.mtg-tooltip');
		const mobileOnlyTooltips = document.querySelectorAll('.mtg-tools-card-name.mtg-tooltip');

		// Always initialize all non-mobile specific tooltips
		initializeTooltips(allTooltips);

		// Conditionally initialize mobile-specific tooltips
		if (shouldShowTooltips()) {
			initializeTooltips(mobileOnlyTooltips);
		} else {
			// Destroy mobile-specific tooltips if they exist
			mobileOnlyTooltips.forEach(tooltip => {
				if (tooltip._tippy) {
					tooltip._tippy.destroy();
				}
			});
		}
	}

	// Apply tooltips initially and on resize
	applyTooltips();
	window.addEventListener('resize', applyTooltips);
});
