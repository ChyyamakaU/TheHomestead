/**
 * TermsPage — Terms and Conditions.
 *
 * Per brand brief section 12.8:
 * - Explain the rules governing use of the platform and submission of enquiries
 *
 * NOTE: This is a draft requiring appropriate legal review.
 */
export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Terms and conditions</h1>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          <div className="legal-page__content">
            <div className="legal-page__notice">
              These terms and conditions are a draft and should be reviewed by a
              qualified legal professional before publication.
            </div>

            <h2>Acceptance of terms</h2>
            <p>
              By accessing and using The Homestead website, you agree to be bound
              by these terms and conditions. If you do not agree with any part of
              these terms, please discontinue use of the website.
            </p>

            <h2>Use of the platform</h2>
            <p>
              Homestead is an apartment discovery and rental enquiry platform. You
              may browse apartments, view property details, and submit applications
              or viewing requests without creating an account.
            </p>
            <p>You agree not to:</p>
            <ul>
              <li>Submit false or misleading information in applications or viewing requests</li>
              <li>Use the platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the platform</li>
              <li>Interfere with the proper functioning of the website</li>
            </ul>

            <h2>Apartment listings</h2>
            <p>
              Apartment listings are provided for informational purposes. While we
              strive to keep information accurate and up to date, availability and
              pricing may change without notice. We recommend confirming details
              through an enquiry before making any commitment.
            </p>

            <h2>Applications and viewing requests</h2>
            <p>
              Submitting an application or viewing request does not guarantee
              approval or confirmation. All submissions are reviewed by our team,
              and you will be contacted using the information you provide.
            </p>
            <p>
              You are responsible for providing accurate and truthful information
              in your submissions.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              Homestead provides a platform for apartment discovery and enquiry
              submission. We are not a party to any rental agreement between
              landlords and tenants. We are not responsible for the outcome of any
              application or viewing request.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms and conditions from time to time. Any
              changes will be posted on this page. Continued use of the platform
              after changes constitutes acceptance of the updated terms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
