import { memo } from '@wordpress/element';
import classnames from 'classnames';

const CardFace = memo(({ 
    face, 
    isFoil, 
    transform_type, 
    display_type, 
    isTransformed,
    rotate_direction,
    onLoad 
}) => {
    // Ensure both transform-type and rotation direction are applied
    const classes = classnames(
        'mtg4wp-card-face',
        {
            [`transform-${transform_type}`]: transform_type !== 'none',
            'is-transformed': isTransformed,
            'is-foil': isFoil,
            [rotate_direction]: Boolean(rotate_direction)
        }
    );

    // Log the classes being applied (for debugging)
    console.log('Card Face Classes:', classes);

    return (
        <div className={classes}>
            <div className="mtg4wp-card-image-container">
                {face.image && (
                    <>
                        <img
                            src={face.image}
                            alt={face.name}
                            className="mtg4wp-card-img"
                            onLoad={onLoad}
                        />
                        {isFoil && <div className="foil-overlay" />}
                    </>
                )}
            </div>
        </div>
    );
});

export default CardFace;