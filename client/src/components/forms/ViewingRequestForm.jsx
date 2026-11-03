import { useState } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { submitViewingRequest } from '../../api/public';
import { getApiErrorMessage } from '../../utils/format';

/**
 * ViewingRequestForm — public form for requesting an apartment viewing.
 *
 * Per brand brief section 11.2:
 * - Collect only necessary information
 * - Validate submitted information
 * - Provide clear success and error messages
 * - Connect to the actual backend
 * - Submitting a request ≠ confirmed appointment
 *
 * Fields matching backend validation:
 *   full_name (min 2 chars), email (valid format), phone (7-15 digits),
 *   preferred_date (valid future date), preferred_time (required),
 *   message (optional)
 */
const TIME_SLOTS = [
  'Morning (8 AM – 12 PM)',
  'Afternoon (12 PM – 4 PM)',
  'Evening (4 PM – 7 PM)',
];

export default function ViewingRequestForm({ apartmentId, apartmentTitle }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    message: '',
  });
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setApiError('');

    // Basic client-side validation
    const clientErrors = [];
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      clientErrors.push('Full name is required (minimum 2 characters).');
    }
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      clientErrors.push('A valid email address is required.');
    }
    const digits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim() || digits.length < 7 || digits.length > 15) {
      clientErrors.push('A valid phone number is required (7–15 digits).');
    }
    if (!formData.preferred_date) {
      clientErrors.push('A preferred viewing date is required.');
    } else {
      const date = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        clientErrors.push('Preferred viewing date must be today or a future date.');
      }
    }
    if (!formData.preferred_time) {
      clientErrors.push('Preferred viewing time is required.');
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitViewingRequest({
        apartment_id: apartmentId,
        ...formData,
      });
      setSuccess(data.message);
    } catch (err) {
      const errMsg = getApiErrorMessage(err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setApiError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success">
        <strong>Request submitted.</strong> {success}
        <br />
        <span className="text-small">
          Please note: submitting a request does not automatically confirm an
          appointment. Our team will contact you to confirm arrangements.
        </span>
      </Alert>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      {apiError && <Alert variant="error">{apiError}</Alert>}
      {errors.length > 0 && (
        <Alert variant="error">
          <strong>Please correct the following:</strong>
          <ul className="enquiry-form__errors">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="enquiry-form__field">
        <label htmlFor="vr-full-name" className="enquiry-form__label">Full name *</label>
        <input
          id="vr-full-name"
          type="text"
          className="enquiry-form__input"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="vr-email" className="enquiry-form__label">Email *</label>
        <input
          id="vr-email"
          type="email"
          className="enquiry-form__input"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="vr-phone" className="enquiry-form__label">Phone *</label>
        <input
          id="vr-phone"
          type="tel"
          className="enquiry-form__input"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          autoComplete="tel"
          placeholder="e.g. +234 801 234 5678"
        />
      </div>

      <div className="enquiry-form__row">
        <div className="enquiry-form__field">
          <label htmlFor="vr-date" className="enquiry-form__label">Preferred date *</label>
          <input
            id="vr-date"
            type="date"
            className="enquiry-form__input"
            value={formData.preferred_date}
            onChange={(e) => handleChange('preferred_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="enquiry-form__field">
          <label htmlFor="vr-time" className="enquiry-form__label">Preferred time *</label>
          <select
            id="vr-time"
            className="enquiry-form__input"
            value={formData.preferred_time}
            onChange={(e) => handleChange('preferred_time', e.target.value)}
          >
            <option value="">Select a time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="vr-message" className="enquiry-form__label">Message (optional)</label>
        <textarea
          id="vr-message"
          className="enquiry-form__input enquiry-form__textarea"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" variant="primary" loading={submitting} className="enquiry-form__submit">
        {submitting ? 'Submitting...' : 'Request viewing'}
      </Button>
    </form>
  );
}
