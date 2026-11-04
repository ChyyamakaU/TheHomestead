import { useState, useEffect, useCallback } from 'react';
import { getSavedIds, saveApartment, unsaveApartment } from '../api/tenant';
import { useAuth } from '../context/AuthContext';

/**
 * useSavedApartments
 *
 * Loads the authenticated tenant's saved apartment IDs once.
 * Exposes isSaved(id) and toggle(id) so any component can check
 * and change the saved state without re-fetching everything.
 *
 * Returns null (not loading, not an error) for non-authenticated users
 * so components can safely call isSaved without guarding.
 */
export function useSavedApartments() {
  const { isTenant } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isTenant) return;
    setLoading(true);
    getSavedIds()
      .then((data) => setSavedIds(new Set(data.ids || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isTenant]);

  const isSaved = useCallback(
    (apartmentId) => savedIds.has(Number(apartmentId)),
    [savedIds]
  );

  const toggle = useCallback(
    async (apartmentId) => {
      const id = Number(apartmentId);
      const wasSaved = savedIds.has(id);
      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(id) : next.add(id);
        return next;
      });
      try {
        if (wasSaved) {
          await unsaveApartment(id);
        } else {
          await saveApartment(id);
        }
      } catch {
        // Revert on error
        setSavedIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(id) : next.delete(id);
          return next;
        });
      }
    },
    [savedIds]
  );

  return { isSaved, toggle, loading };
}
