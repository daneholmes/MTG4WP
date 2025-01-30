import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
    Button,
    TextareaControl,
    Modal,
    Notice
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const DeckImporter = ({ onImport, onClose }) => {
    const [importText, setImportText] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    const parseCardLine = (line) => {
        const regex = /^(\d+)\s+([^(]+?)\s+\(([^)]+)\)\s+([\w\-★]+)(?:\s+\*F\*)?(?:\s+\[([^\]]+)\])?$/;
        const match = line.trim().match(regex);

        if (!match) {
            throw new Error(`Invalid line format: ${line}`);
        }

        const [, quantity, name, set, number] = match;
        
        const cleanNumber = number.replace(/★/g, '');
        
        return {
            quantity: parseInt(quantity, 10),
            name: name.trim(),
            set: set.toLowerCase(),
            number: cleanNumber,
            foil: line.includes('*F*'),
            section: (match[5] || 'mainboard').toLowerCase()
        };
    };

    const importDeck = async () => {
        setImporting(true);
        setError('');

        try {
            const lines = importText
                .split('\n')
                .filter(line => line.trim());

            const cardPromises = lines.map(async (line, index) => {
                try {
                    const parsedCard = parseCardLine(line);
                    
                    const response = await apiFetch({
                        path: '/wp/v2/mtg4wp/search',
                        method: 'POST',
                        data: {
                            card_name: parsedCard.name,
                            set: parsedCard.set,
                            number: parsedCard.number
                        }
                    });

                    if (!response || !response.faces || !response.faces.length) {
                        throw new Error(`Card not found: ${parsedCard.name}`);
                    }

                    return {
                        ...response,
                        quantity: parsedCard.quantity,
                        foil: parsedCard.foil,
                        section: parsedCard.section
                    };

                } catch (err) {
                    console.error(`Error importing line ${index + 1}:`, err);
                    throw new Error(`Line ${index + 1}: ${err.message}`);
                }
            });

            const importedCards = await Promise.all(cardPromises);
            onImport(importedCards);
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <Modal
            title={__('Import Deck', 'mtg4wp')}
            onRequestClose={onClose}
            className="mtg4wp-importer-modal"
        >
            <div className="mtg4wp-importer">
                <TextareaControl
                    label={__('Paste your deck list', 'mtg4wp')}
                    help={__('Format: "1 Card Name (SET) 123 *F* [Section]"', 'mtg4wp')}
                    value={importText}
                    onChange={setImportText}
                    rows={10}
                />

                {error && (
                    <Notice 
                        status="error" 
                        isDismissible={false}
                        className="mtg4wp-import-error"
                    >
                        {error}
                    </Notice>
                )}

                <div className="mtg4wp-importer-actions">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        {__('Cancel', 'mtg4wp')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={importDeck}
                        isBusy={importing}
                        disabled={importing || !importText.trim()}
                    >
                        {__('Import', 'mtg4wp')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeckImporter;