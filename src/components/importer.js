import { __ } from '@wordpress/i18n';
import { Button, TextareaControl, Modal, Notice, __experimentalHeading as Heading } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

const DeckImporter = ({ attributes = {}, setAttributes, onImport, onClose }) => {
    const { importText = '', importing = false, error = '' } = attributes;

    const handleImport = async () => {
        try {
            setAttributes({ importing: true, error: '' });

            const response = await apiFetch({
                path: '/mtg4wp/v1/deck/import',
                method: 'POST',
                data: { deck_list: importText }
            });

            if (response.errors.length > 0) {
                setAttributes({
                    error: (
                        <div className="mtg4wp-import-errors">
                            <p>{__('Some cards could not be imported:', 'mtg4wp')}</p>
                            <ul>
                                {response.errors.map((error, index) => (
                                    <li key={index}>
                                        {__('Line', 'mtg4wp')} {error.line}: {error.message}
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

    const placeholderText = `4 Lightning Bolt (sld) 901 *F* [mainboard]
2 Spell Pierce
3 Steam Vents (grn)
1 Blood Moon [sideboard]
`;

    return (
        <Modal
            title={<Heading level={2}>{__('Import Deck', 'mtg4wp')}</Heading>}
            onRequestClose={onClose}
            className="mtg4wp-importer-modal"
        >
            <div className="mtg4wp-importer">
                <TextareaControl
                    label={__('Paste your deck list', 'mtg4wp')}
                    help={__('Format: Quantity Card Name (Set Code) Collector Number *F* [Section]', 'mtg4wp')}
                    value={importText}
                    onChange={(newText) => setAttributes({ importText: newText })}
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
                        {__('Cancel', 'mtg4wp')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
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