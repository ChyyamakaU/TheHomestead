import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import SaveButton from '../ui/SaveButton';
import {
  formatPrice,
  formatLocation,
  getPrimaryImage,
  getImageUrl,
} from '../../utils/format';

/**
 * ApartmentCard — reusable listing card.
 *
 * Optional save button (Phase 5):
 *   isSaved   — boolean, pass from useSavedApartments hook
 *   onToggle  — function(id), pass from useSavedApartments hook
 * If neither prop is provided the save button is hidden.
 */
export default function ApartmentCard({ apartment, isSaved, onToggle }) {
  const imageUrl = getImageUrl(getPrimaryImage(apartment));
  const location = formatLocation(apartment);
  const showSave = onToggle !== undefined;

  return (
    <article className="apartment-card">
      <Link to={`/apartments/${apartment.slug}`} className="apartment-card__link">
        {/* Photo */}
        <div className="apartment-card__image-wrap">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={apartment.title}
              className="apartment-card__image"
              loading="lazy"
            />
          ) : (
            <div className="apartment-card__placeholder">
              <span>No photo</span>
            </div>
          )}
          <div className="apartment-card__badge">
            <StatusBadge status={apartment.availability} type="availability" />
          </div>
          {/* Save button — overlaid top-right of image */}
          {showSave && (
            <SaveButton
              apartmentId={apartment.id}
              isSaved={!!isSaved}
              onToggle={onToggle}
              variant="card"
            />
          )}
        </div>

        {/* Content */}
        <div className="apartment-card__body">
          <h3 className="apartment-card__title">{apartment.title}</h3>
          <p className="apartment-card__location">{location}</p>

          <div className="apartment-card__specs">
            <span className="apartment-card__spec">
              {apartment.bedrooms} bed{apartment.bedrooms !== 1 ? 's' : ''}
            </span>
            <span className="apartment-card__spec">
              {apartment.bathrooms} bath{apartment.bathrooms !== 1 ? 's' : ''}
            </span>
            {apartment.size && (
              <span className="apartment-card__spec">{apartment.size} m²</span>
            )}
          </div>

          {apartment.amenities?.length > 0 && (
            <div className="apartment-card__amenities">
              {apartment.amenities.slice(0, 3).map((a) => (
                <span key={a.id} className="apartment-card__amenity">{a.name}</span>
              ))}
              {apartment.amenities.length > 3 && (
                <span className="apartment-card__amenity apartment-card__amenity--more">
                  +{apartment.amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="apartment-card__footer">
            <span className="apartment-card__price">
              {formatPrice(apartment.price, apartment.payment_period)}
            </span>
            <span className="apartment-card__cta">View apartment →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
