import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import {
  formatPrice,
  formatLocation,
  getPrimaryImage,
  getImageUrl,
  truncate,
} from '../../utils/format';

/**
 * ApartmentCard — reusable listing card for public browsing.
 *
 * Per brand brief section 6:
 * - White background, ~12px rounded corners, subtle border/shadow
 * - Shows: photograph, availability, title, location, price, payment period,
 *   bedrooms, bathrooms, size, a few amenities, "View apartment" link
 * - Desktop: 3 per row, Medium: 2, Mobile: 1
 */
export default function ApartmentCard({ apartment }) {
  const imageUrl = getImageUrl(getPrimaryImage(apartment));
  const location = formatLocation(apartment);

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
        </div>

        {/* Content */}
        <div className="apartment-card__body">
          <h3 className="apartment-card__title">{apartment.title}</h3>
          <p className="apartment-card__location">{location}</p>

          <div className="apartment-card__specs">
            <span className="apartment-card__spec">{apartment.bedrooms} bed{apartment.bedrooms !== 1 ? 's' : ''}</span>
            <span className="apartment-card__spec">{apartment.bathrooms} bath{apartment.bathrooms !== 1 ? 's' : ''}</span>
            {apartment.size && (
              <span className="apartment-card__spec">{apartment.size} m²</span>
            )}
          </div>

          {/* Amenities (first 3) */}
          {apartment.amenities?.length > 0 && (
            <div className="apartment-card__amenities">
              {apartment.amenities.slice(0, 3).map((a) => (
                <span key={a.id} className="apartment-card__amenity">
                  {a.name}
                </span>
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
