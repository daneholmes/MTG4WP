/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/edit.js":
/*!*********************!*\
  !*** ./src/edit.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _editor_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./editor.scss */ "./src/editor.scss");






function Edit({
  attributes,
  setAttributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__.useBlockProps)();
  const [cards, setCards] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(attributes.cards || []);
  const [isLoading, setIsLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const typePriority = ['Creature', 'Land', 'Artifact', 'Enchantment', 'Planeswalker', 'Battle', 'Instant', 'Sorcery'];

  // Function to prioritize card types
  const prioritizeType = types => {
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
          scryfall_uri: data.scryfall_uri
        };
        setCards(newCards);
        setAttributes({
          cards: newCards
        });
      }
    } catch (error) {
      console.error(`Error fetching card data: ${error}`);
    } finally {
      setIsLoading(false);
      console.log('Fetch operation completed.');
    }
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    setIsLoading(true);
    const fetchCards = async () => {
      for (let i = 0; i < cards.length; i++) {
        await fetchCardData(cards[i], i);
        await delay(50);
      }
      setIsLoading(false);
    };
    fetchCards();
  }, [cards.map(card => `${card.name}-${card.set}-${card.number}`).join(',')]);

  // Update card field values
  const updateCard = (index, key, value) => {
    const updatedCards = [...cards];
    updatedCards[index][key] = value;
    setCards(updatedCards);
    setAttributes({
      cards: updatedCards
    });
  };

  // Add new card template
  const addCard = () => {
    const newCard = {
      name: '',
      set: '',
      number: '',
      quantity: 1,
      commander: false,
      foil: false
    };
    setCards([...cards, newCard]);
    setAttributes({
      cards: [...cards, newCard]
    });
  };

  // Remove existing card
  const removeCard = index => {
    const updatedCards = cards.filter((_, i) => i !== index);
    setCards(updatedCards);
    setAttributes({
      cards: updatedCards
    });
  };
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps
  }, isLoading && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Spinner, null), cards.map((card, index) => (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    key: index,
    className: "mtg-card"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Name', 'mtg-tools'),
    value: card.name,
    onChange: value => updateCard(index, 'name', value)
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Set', 'mtg-tools'),
    value: card.set,
    onChange: value => updateCard(index, 'set', value)
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Number', 'mtg-tools'),
    value: card.number,
    onChange: value => updateCard(index, 'number', value)
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Quantity', 'mtg-tools'),
    type: "number",
    value: card.quantity,
    onChange: value => updateCard(index, 'quantity', parseInt(value))
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Commander', 'mtg-tools'),
    checked: card.commander,
    onChange: value => updateCard(index, 'commander', value)
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Foil', 'mtg-tools'),
    checked: card.foil,
    onChange: value => updateCard(index, 'foil', value)
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
    isDestructive: true,
    onClick: () => removeCard(index)
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Remove Card', 'mtg-tools')))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
    isPrimary: true,
    onClick: addCard
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Add Card', 'mtg-tools')));
}

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./style.scss */ "./src/style.scss");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/edit.js");
/* harmony import */ var _save__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./save */ "./src/save.js");
/* harmony import */ var _block_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./block.json */ "./src/block.json");
/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */


/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */


/**
 * Internal dependencies
 */




/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(_block_json__WEBPACK_IMPORTED_MODULE_4__.name, {
  /**
   * @see ./edit.js
   */
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  /**
   * @see ./save.js
   */
  save: _save__WEBPACK_IMPORTED_MODULE_3__["default"]
});

/***/ }),

/***/ "./src/save.js":
/*!*********************!*\
  !*** ./src/save.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ save)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__);



// Sort by CMC then alphabetically
const sortByCmcThenName = (a, b) => {
  if (a.cmc !== b.cmc) {
    return a.cmc - b.cmc;
  }
  return a.name.localeCompare(b.name);
};

// Count of unique card types
const countCardTypes = cards => cards.length + 1;

// Sum of all specified quantities for a group
const sumCardQuantities = cards => cards.reduce((sum, card) => sum + (card.quantity || 1), 0);

// Render cards in a group
const renderCardGroup = (type, cards) => {
  const groupQuantity = countCardTypes(cards);
  return cards.length > 0 ? (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    key: type
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("h2", {
    className: "has-small-font-size"
  }, `${type} (${sumCardQuantities(cards)})`), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-card-category"
  }, cards.map((card, index) => (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    key: card.id || index,
    className: "mtg-tools-card has-small-font-size",
    "data-card-name": card.scryfallName || card.name,
    "data-card-front-image-uri": card.frontImage || '',
    "data-card-back-image-uri": card.backImage || '',
    "data-card-foil": card.foil ? 'Yes' : 'No'
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "mtg-tools-quantity"
  }, card.quantity || 1), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-card-wrapper"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("a", {
    href: card.scryfall_uri,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "mtg-tools-card-name"
  }, card.scryfallName || card.name), card.backImage && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-flip-button"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("button", {
    className: "mtg-tools-flip dashicons dashicons-image-rotate",
    type: "button"
  }))))))) : null;
};
function save({
  attributes
}) {
  const blockProps = _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.useBlockProps.save();
  const {
    cards = []
  } = attributes;

  // Identify and sort commanders
  const commanderCards = cards.filter(card => card.commander).sort(sortByCmcThenName);

  // Define groups
  const typePriority = [{
    type: 'Artifacts',
    condition: card => card.type === 'Artifact' && !card.commander
  }, {
    type: 'Battles',
    condition: card => card.type === 'Battle' && !card.commander
  }, {
    type: 'Creatures',
    condition: card => card.type === 'Creature' && !card.commander
  }, {
    type: 'Planeswalkers',
    condition: card => card.type === 'Planeswalker' && !card.commander
  }, {
    type: 'Enchantments',
    condition: card => card.type === 'Enchantment' && !card.commander
  }, {
    type: 'Instants',
    condition: card => card.type === 'Instant' && !card.commander
  }, {
    type: 'Sorceries',
    condition: card => card.type === 'Sorcery' && !card.commander
  }, {
    type: 'Lands',
    condition: card => card.type === 'Land' && !card.commander
  }];

  // Sort groups
  const groupedCards = typePriority.reduce((acc, group) => {
    acc[group.type] = cards.filter(group.condition).sort(sortByCmcThenName);
    return acc;
  }, {});

  // Add commander to start of groups
  const allGroups = {
    Commander: commanderCards,
    ...groupedCards
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
  const defaultImage = defaultCard?.frontImage || '../assets/mtg_card_back.png';
  const defaultAltText = defaultCard?.scryfallName || 'Magic: The Gathering Card';
  const defaultFoil = defaultCard?.foil ? 'Yes' : 'No';
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps,
    className: "mtg-tools-container"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-column mtg-tools-image-column"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-sticky"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("img", {
    id: "mtg-tools-default-image",
    src: defaultImage,
    alt: defaultAltText,
    className: "mtg-tools-image",
    "data-foil": defaultFoil
  }), defaultCard?.foil && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-gradient-overlay"
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-column"
  }, Object.entries(leftGroups).map(([type, cards]) => renderCardGroup(type, cards))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "mtg-tools-column"
  }, Object.entries(rightGroups).map(([type, cards]) => renderCardGroup(type, cards))));
}

/***/ }),

/***/ "./src/editor.scss":
/*!*************************!*\
  !*** ./src/editor.scss ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/style.scss":
/*!************************!*\
  !*** ./src/style.scss ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

module.exports = window["React"];

/***/ }),

/***/ "@wordpress/block-editor":
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
/***/ ((module) => {

module.exports = window["wp"]["blockEditor"];

/***/ }),

/***/ "@wordpress/blocks":
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
/***/ ((module) => {

module.exports = window["wp"]["blocks"];

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/***/ ((module) => {

module.exports = window["wp"]["components"];

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ }),

/***/ "./src/block.json":
/*!************************!*\
  !*** ./src/block.json ***!
  \************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"mtg-tools/mtg-tools","version":"1.0.0","title":"Deck","category":"widgets","icon":"list-view","description":"A plugin for displaying Magic: The Gathering cards on WordPress","example":{},"supports":{"html":false,"anchor":true,"align":true,"multiple":true},"attributes":{"cards":{"type":"array","default":[{"name":"","set":"","number":"","quantity":1,"commander":false,"foil":false}],"items":{"type":"object","properties":{"name":{"type":"string"},"set":{"type":"string"},"number":{"type":"string"},"quantity":{"type":"number"},"commander":{"type":"boolean"},"foil":{"type":"boolean"}}}}},"textdomain":"mtg-tools","editorScript":"file:./index.js","editorStyle":"file:./index.css","style":"file:./style-index.css","viewScript":"file:./view.js"}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"index": 0,
/******/ 			"./style-index": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkmtg_tools"] = globalThis["webpackChunkmtg_tools"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["./style-index"], () => (__webpack_require__("./src/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map