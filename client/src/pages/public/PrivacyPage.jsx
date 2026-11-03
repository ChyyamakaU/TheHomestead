/**
 * PrivacyPage — Privacy Policy.
 *
 * Per brand brief section 12.7:
 * - What personal information is collected
 * - Why it is collected
 * - How information is stored and protected
 * - Who can access it
 * - Whether information is shared with third parties
 * - How long information is retained
 * - What rights visitors have
 * - How to contact about privacy concerns
 *
 * NOTE: Per the brief, this is a draft requiring appropriate legal review.
 * If operating in Nigeria, review the Nigeria Data Protection Act 2023.
 */
export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Privacy policy</h1>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          <div className="legal-page__content">
            <div className="legal-page__notice">
              This privacy policy is a draft and should be reviewed by a qualified
              legal professional before publication. If the platform operates in
              Nigeria, review applicable requirements including the Nigeria Data
              Protection Act 2023.
            </div>

            <h2>Information we collect</h2>
            <p>
              When you submit a viewing request or rental application through
              Homestead, we collect the following personal information:
            </p>
            <ul>
              <li>Your full name</li>
              <li>Your email address</li>
              <li>Your phone number</li>
              <li>Your preferred viewing date and time (for viewing requests)</li>
              <li>Your intended move-in date (for applications)</li>
              <li>Any additional message you choose to include</li>
            </ul>

            <h2>Why we collect your information</h2>
            <p>
              Your information is collected solely for the purpose of handling your
              application or viewing request and communicating with you about your
              enquiry. We use your contact details to respond to your request and
              provide updates on its status.
            </p>

            <h2>How your information is stored and protected</h2>
            <p>
              Your information is stored in our database and accessible only to
              authorised administrators. Authentication tokens used for admin access
              are stored as HTTP-only cookies to protect against unauthorised access.
            </p>
            <p>
              Passwords are hashed using industry-standard algorithms before storage.
              We do not store passwords in plain text.
            </p>

            <h2>Who can access your information</h2>
            <p>
              Access to your personal information is restricted to authorised
              administrators who review applications and viewing requests. No other
              parties have access to your submitted information.
            </p>

            <h2>Sharing with third parties</h2>
            <p>
              We do not sell, rent, or share your personal information with third
              parties for marketing purposes. Your information is used only for
              processing your enquiry as described in this policy.
            </p>

            <h2>How long we retain your information</h2>
            <p>
              Your application and viewing request information is retained for as
              long as necessary to process your enquiry and for a reasonable period
              thereafter for record-keeping purposes. You may request deletion of
              your information by contacting us.
            </p>

            <h2>Your rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Request access to the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw consent for the processing of your information</li>
            </ul>

            <h2>Contacting us about privacy</h2>
            <p>
              If you have any questions or concerns about how your personal
              information is handled, please contact us through our contact page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
