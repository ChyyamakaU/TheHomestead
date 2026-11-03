import { titleCase } from '../../utils/format';
import Badge from './Badge';

/**
 * StatusBadge — maps an apartment/viewing-request/application status
 * to the correct Badge variant.
 *
 * Apartment availability: available, occupied, unavailable
 * Apartment status: published, draft
 * Viewing request status: pending, confirmed, completed, cancelled
 * Application status: pending, under_review, approved, rejected
 */
const STATUS_MAP = {
  // Apartment availability
  available: { variant: 'available', label: 'Available' },
  occupied: { variant: 'occupied', label: 'Rented' },
  unavailable: { variant: 'unavailable', label: 'Unavailable' },

  // Apartment publish status
  published: { variant: 'published', label: 'Published' },
  draft: { variant: 'draft', label: 'Draft' },

  // Viewing request statuses
  pending: { variant: 'pending', label: 'Pending' },
  confirmed: { variant: 'confirmed', label: 'Confirmed' },
  completed: { variant: 'completed', label: 'Completed' },
  cancelled: { variant: 'cancelled', label: 'Cancelled' },

  // Application statuses
  under_review: { variant: 'under_review', label: 'Under review' },
  approved: { variant: 'approved', label: 'Approved' },
  rejected: { variant: 'rejected', label: 'Rejected' },
};

export default function StatusBadge({ status, type = 'availability' }) {
  const config = STATUS_MAP[status] || { variant: 'neutral', label: titleCase(status) };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
