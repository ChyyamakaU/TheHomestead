import { useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * ImageGallery — displays apartment photographs with a main image
 * and thumbnails for navigation.
 *
 * Per brand brief section 7: displays the actual photographs uploaded
 * for each apartment. Lazy-loads images with meaningful alt text.
 */
export default function ImageGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery image-gallery--empty">
        <div className="image-gallery__placeholder">
          <span>No photographs available</span>
        </div>
      </div>
    );
  }

  // Sort images by display_order, primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  const activeImage = sortedImages[activeIndex] || sortedImages[0];

  return (
    <div className="image-gallery">
      <div className="image-gallery__main">
        <img
          src={getImageUrl(activeImage.url)}
          alt={`Photograph of apartment — view ${activeIndex + 1} of ${sortedImages.length}`}
          className="image-gallery__main-image"
        />
      </div>

      {sortedImages.length > 1 && (
        <div className="image-gallery__thumbs" role="tablist" aria-label="Apartment photographs">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id || idx}
              className={cn(
                'image-gallery__thumb',
                idx === activeIndex && 'image-gallery__thumb--active'
              )}
              onClick={() => setActiveIndex(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`View photograph ${idx + 1}`}
            >
              <img
                src={getImageUrl(img.url)}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { getImageUrl } from '../../utils/format';
