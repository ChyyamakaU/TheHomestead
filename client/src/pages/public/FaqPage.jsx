import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

/**
 * FaqPage — Frequently Asked Questions page.
 *
 * Per brand brief section 18:
 * - Group questions into 6 categories
 * - Accessible expandable accordion
 * - Search field that searches FAQ questions
 * - Responsive
 * - Contact link at bottom
 * - Content easy to update (data structure below)
 */

const FAQ_DATA = [
  {
    category: 'Finding an apartment',
    questions: [
      { q: 'How do I find an apartment on Homestead?', a: 'You can browse available apartments on our website or use the search filters to narrow your options by location, apartment type, price and number of bedrooms.' },
      { q: 'Can I view apartment details before making an enquiry?', a: 'Yes. Each listing has a dedicated page containing available property information, photographs, pricing, amenities and availability status.' },
      { q: 'How do I know if an apartment is available?', a: 'Each listing displays its current availability status. However, availability can change, so we recommend submitting an enquiry to confirm before making any arrangements.' },
      { q: 'Can I search for apartments within a particular budget?', a: 'Yes. Use the price filter to find apartments within your preferred budget.' },
    ],
  },
  {
    category: 'Applications and enquiries',
    questions: [
      { q: 'How do I apply for an apartment?', a: 'Open the apartment listing you are interested in and select the application option. Complete and submit the application form with the requested information.' },
      { q: 'Do I need to create an account to apply?', a: 'No. You can browse apartments and submit an application or viewing request without creating an account.' },
      { q: 'What happens after I submit an application?', a: 'Your application will be received for review. The relevant team will review the information and contact you using the contact details you provided.' },
      { q: 'How will I know if my application has been approved?', a: 'You will be contacted using the contact information provided in your application with an update on its status.' },
    ],
  },
  {
    category: 'Apartment viewings',
    questions: [
      { q: 'Can I request to view an apartment before applying?', a: 'Yes. You can submit a viewing request directly from the apartment\'s details page.' },
      { q: 'How do I arrange a viewing?', a: 'Select the Request a Viewing option, complete the form and submit your preferred viewing details. The team will contact you to confirm the arrangements.' },
      { q: 'Is submitting a viewing request the same as booking a confirmed viewing?', a: 'No. Submitting a request does not automatically confirm an appointment. You will receive confirmation after the request has been reviewed.' },
    ],
  },
  {
    category: 'Pricing and payments',
    questions: [
      { q: 'Are the prices displayed on Homestead accurate?', a: 'The prices displayed reflect the information provided for each listing. Please contact the team to confirm the current price and any additional charges before making a commitment.' },
      { q: 'Does the listed price include additional charges?', a: 'Any additional charges should be clarified with the relevant contact before proceeding. Check the apartment details and submit an enquiry if you need further information.' },
      { q: 'Can I make rental payments through Homestead?', a: 'Homestead currently provides apartment discovery and enquiry services. Any rental payment arrangements should be confirmed directly through the authorised contact.' },
    ],
  },
  {
    category: 'Account and privacy',
    questions: [
      { q: 'Do I need an account to browse apartments?', a: 'No. You can explore apartment listings freely without registering.' },
      { q: 'How does Homestead use my personal information?', a: 'Information submitted through our forms is used to handle your application or viewing request and communicate with you about your enquiry. Please refer to our Privacy Policy for further details.' },
      { q: 'Is my personal information shared with other people?', a: 'Personal information is handled according to the practices explained in our Privacy Policy. Please review the policy for details about access to and sharing of your information.' },
    ],
  },
  {
    category: 'Contact and support',
    questions: [
      { q: 'What if I have a question about an apartment?', a: 'You can use the contact details provided on our Contact page to get in touch with the team.' },
      { q: 'What if I cannot find an apartment that suits my needs?', a: 'You can continue checking the website for new listings or contact the team to enquire about available options.' },
      { q: 'How can I report an incorrect listing or outdated information?', a: 'Please contact the team with the apartment details and explain what information appears to be incorrect.' },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');

  const toggleItem = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return FAQ_DATA;
    const query = search.toLowerCase();
    return FAQ_DATA.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [search]);

  return (
    <div className="faq-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Frequently asked questions</h1>
          <p className="page-header__sub">
            Find answers to common questions about Homestead.
          </p>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          {/* Search */}
          <div className="faq-page__search">
            <div className="search-bar">
              <input
                type="text"
                className="search-bar__input"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search FAQ"
              />
            </div>
          </div>

          {filteredData.length > 0 ? (
            filteredData.map((cat, catIdx) => (
              <div key={catIdx} className="faq-category">
                <h2 className="faq-category__title">{cat.category}</h2>
                <div className="faq-accordion">
                  {cat.questions.map((item, qIdx) => {
                    const key = `${catIdx}-${qIdx}`;
                    const isOpen = !!openItems[key];
                    return (
                      <div key={qIdx} className={cn('faq-accordion__item', isOpen && 'faq-accordion__item--open')}>
                        <button
                          className="faq-accordion__question"
                          onClick={() => toggleItem(catIdx, qIdx)}
                          aria-expanded={isOpen}
                        >
                          {item.q}
                          <span className="faq-accordion__icon">+</span>
                        </button>
                        <div className="faq-accordion__answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h3 className="empty-state__title">No results found</h3>
              <p className="empty-state__message">
                No questions match your search. Try different keywords.
              </p>
            </div>
          )}

          {/* Closing CTA */}
          <div className="faq-page__closing">
            <h3>Still have questions? We're happy to help.</h3>
            <p>
              If you need more information about an apartment or the application
              process, please get in touch with our team.
            </p>
            <Link to="/contact" className="btn btn--primary">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
