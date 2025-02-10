import { __ } from '@wordpress/i18n';
import { Button, TextareaControl, Modal, Notice, __experimentalHeading as Heading } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

const DeckImporter = ({ attributes = {}, setAttributes, onImport, onClose }) => {
    const { import_text = '', importing = false, error = '' } = attributes;
    const [showDelayMessage, setShowDelayMessage] = useState(false);

    const handleImport = async () => {
        try {
            setAttributes({ importing: true, error: '' });

            const response = await apiFetch({
                path: '/mtg4wp/v1/deck/import',
                method: 'POST',
                data: { deck_list: import_text }
            });

            if (response.errors.length > 0) {
                setAttributes({
                    error: (
                        <div className="mtg4wp-import-errors">
                            <p>{__('Some cards could not be imported:', 'l4m4w')}</p>
                            <ul>
                                {response.errors.map((error, index) => (
                                    <li key={index}>
                                        {__('Line', 'l4m4w')} {error.line}: {error.message}
                                        <code>{error.content}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                });
            }

            if (response.cards.length > 0) {
                onImport(response.cards);
            }
        } catch (err) {
            setAttributes({ error: err.message });
        } finally {
            setAttributes({ importing: false });
        }
    };

    useEffect(() => {
        let timeoutId;
        if (importing) {
            timeoutId = setTimeout(() => setShowDelayMessage(true), 2000);
        } else {
            setShowDelayMessage(false);
        }
        return () => clearTimeout(timeoutId);
    }, [importing]);

    const placeholderText = `4 Tarmogoyf (fut) [mainboard]
2 Thoughtseize
4 Liliana of the Veil (uma) *F*
2 Seasoned Pyromancer (2x2) 363
3 Collective Brutality [sideboard]
1 Restless Ridgeline (lci) 283 *F* [maybeboard]
4 Verdant Catacombs *F*
1 Elemental t2x2 [tokens]
`;

    return (
        <Modal
            title={<Heading level={2}>{__('Import Deck', 'l4m4w')}</Heading>}
            onRequestClose={onClose}
            className="mtg4wp-importer-modal"
        >
            <div className="mtg4wp-importer">
                <TextareaControl
                    label={__('Paste your deck list', 'l4m4w')}
                    help={__('Format: Quantity Card Name (Set Code) Collector Number *F* [Section]', 'l4m4w')}
                    value={import_text}
                    onChange={(newText) => setAttributes({ import_text: newText })}
                    placeholder={placeholderText}
                    rows={12}
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
                        {__('Cancel', 'l4m4w')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        isBusy={importing}
                        disabled={importing || !import_text.trim()}
                    >
                        {__('Import', 'l4m4w')}
                    </Button>
                </div>
                {showDelayMessage && (
                    <Notice
                        status="info"
                        isDismissible={false}
                        className="mtg4wp-import-notice"
                    >
                        {__('Hold tight. Importing 10 cards per second.', 'l4m4w')}
                    </Notice>
                )}
            </div>
        </Modal>
    );
};

export default DeckImporter;