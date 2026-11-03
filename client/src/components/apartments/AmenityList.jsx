/**
 * AmenityList — displays apartment amenities as a clean list with checkmarks.
 */
export default function AmenityList({ amenities = [] }) {
  if (!amenities || amenities.length === 0) {
    return <p className="amenity-list--empty">No amenities listed.</p>;
  }

  return (
    <ul className="amenity-list">
      {amenities.map((amenity) => (
        <li key={amenity.id || amenity.name} className="amenity-list__item">
          <span className="amenity-list__check" aria-hidden="true">✓</span>
          {amenity.name}
        </li>
      ))}
    </ul>
  );
}
