import { Link } from 'react-router-dom';

/**
 * NotFoundPage — 404 page.
 * Shown when no route matches.
 */
export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="container">
        <h1>404</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </div>
  );
}
