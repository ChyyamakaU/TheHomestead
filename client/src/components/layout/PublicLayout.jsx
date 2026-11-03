import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PublicLayout — wraps all public-facing pages.
 * Renders the navbar at the top, the page content (Outlet) in the middle,
 * and the footer at the bottom.
 */
export default function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
