import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout — wraps all admin dashboard pages.
 *
 * Per brand brief section 13:
 * - Light backgrounds, White content surfaces
 * - Midnight and Brass brand accents
 * - Clear sidebar navigation
 * - Prioritises usability and efficiency over decoration
 */
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
