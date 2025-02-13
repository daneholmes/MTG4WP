import { __ } from '@wordpress/i18n';
import { 
    Button, 
    TextareaControl, 
    Modal, 
    Notice,
    Spinner,
    __experimentalHeading as Heading 
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

const DeckImporter = ({ attributes = {}, setAttributes, onImport, onClose }) => {
    const { import_text = '', importing = false, error = '' } = attributes;
    const [showDelayMessage, setShowDelayMessage] = useState(false);

    useEffect(() => {
        let timeoutId;
        if (importing) {
            timeoutId = setTimeout(() => setShowDelayMessage(true), 5000);
        } else {
            setShowDelayMessage(false); 
        }
        return () => clearTimeout(timeoutId);
    }, [importing]);

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

    const placeholderText = `4 Lightning Bolt (2x2)
1 Blightning (plst) A25-198
2 Swamp *F*
1 Sword of Light and Shadow (2xm) [sideboard]
3 Treetop Village (ddr)
2 Ancient Grudge (mm3) [sideboard]
1 Misty Rainforest (mh2) 438
2 Maelstrom Pulse (fdn)
2 Olivia Voldaren (inr) *F* [sideboard]
2 Blood Crypt (rvr) 397 *F*
4 Deathrite Shaman (rvr) 363
2 Shatterstorm (atq) [sideboard]
1 Stomping Ground (rvr) 413 *F*
2 Fulminator Mage (2xm) [sideboard]
3 Thoughtseize (tsr) 334
4 Verdant Catacombs (mh2) 440
1 Grim Lavamancer (dmr) [sideboard]
4 Dark Confidant (rav)
4 Liliana of the Veil (uma)
4 Tarmogoyf (mm2) *F*
1 Sowing Salt (uds) [sideboard]
2 Chandra, Pyromaster (m14)
3 Marsh Flats (mh2) 437
2 Grafdigger's Cage (m20) [sideboard]
1 Forest
2 Scavenging Ooze
1 Pillar of Flame (ima)
1 Obstinate Baloth (ima) [sideboard]
2 Raging Ravine (clb)
1 Overgrown Tomb (rvr) 407
4 Blackcleave Cliffs (one)
2 Terminate (dmc)
3 Inquisition of Kozilek (mm3)
1 Thoughtseize (tsr) [sideboard]`;

    return (
        <Modal
            title={<Heading level={2}>{__('Import Deck', 'mtg4wp')}</Heading>}
            onRequestClose={onClose}
            className="mtg4wp-importer-modal"
        >
            <div className="mtg4wp-importer">
                <div className="mtg4wp-notice-container">
                    {error && (
                        <Notice 
                            status="error" 
                            isDismissible={false}
                            className="mtg4wp-import-error"
                        >
                            {error}
                        </Notice>
                    )}
                    {importing && showDelayMessage && (
                        <Notice
                            status="info"
                            isDismissible={false}
                            className="mtg4wp-import-status"
                        >
                            <div className="mtg4wp-import-status-content">
                                <Spinner />
                                {__('Still processing deck...', 'mtg4wp')}
                            </div>
                        </Notice>
                    )}
                </div>

                <TextareaControl
                    label={__('Paste your deck list', 'mtg4wp')}
                    help={__('Format: Quantity Card Name (Set Code) Collector Number *F* [Section]', 'mtg4wp')}
                    value={import_text}
                    onChange={(newText) => setAttributes({ import_text: newText })}
                    placeholder={placeholderText}
                    rows={12}
                />

                <div className="mtg4wp-importer-actions">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={importing}
                    >
                        {__('Cancel', 'mtg4wp')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        isBusy={importing}
                        disabled={importing || !import_text.trim()}
                    >
                        {importing ? __('Importing...', 'mtg4wp') : __('Import', 'mtg4wp')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeckImporter;