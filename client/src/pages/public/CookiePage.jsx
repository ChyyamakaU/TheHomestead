/**
 * CookiePage — Cookie Policy.
 *
 * Per brand brief section 12.9:
 * - Explain the cookies and similar technologies actually used by the website
 *
 * NOTE: This is a draft requiring appropriate legal review.
 */
export default function CookiePage() {
  return (
    <div className="legal-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Cookie policy</h1>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          <div className="legal-page__content">
            <div className="legal-page__notice">
              This cookie policy is a draft and should be reviewed by a qualified
              legal professional before publication.
            </div>

            <h2>What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a
              website. They help the website remember information about your visit,
              such as your preferences or authentication status.
            </p>

            <h2>Cookies used by Homestead</h2>
            <p>The Homestead website uses the following cookies:</p>
            <ul>
              <li>
                <strong>Authentication token (HTTP-only)</strong> — This cookie
                stores a JSON Web Token (JWT) to authenticate admin users. It is
                HTTP-only, meaning it cannot be accessed by JavaScript, and is used
                solely for maintaining admin sessions. It expires after 7 days.
              </li>
            </ul>

            <h2>Third-party cookies</h2>
            <p>
              We do not use third-party advertising or tracking cookies. Google
              Fonts may set cookies when loading web fonts, but these are used
              only for font delivery and do not track your activity.
            </p>

            <h2>Managing cookies</h2>
            <p>
              You can control and delete cookies through your browser settings.
              Disabling cookies may affect the functionality of the admin login
              area. Public browsing of apartments does not require cookies.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this cookie policy if our use of cookies changes. Any
              updates will be posted on this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
