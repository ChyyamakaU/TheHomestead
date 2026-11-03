import { useState } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { submitApplication } from '../../api/public';
import { getApiErrorMessage } from '../../utils/format';

/**
 * ApplicationForm — public form for submitting a rental application.
 *
 * Per brand brief section 11.1:
 * - Collect only necessary information
 * - Identify the apartment being applied for
 * - Validate submitted information
 * - Provide clear feedback after submission
 * - Connect to the actual backend
 * - No account required
 *
 * Fields matching backend validation:
 *   full_name (min 2 chars), email (valid format), phone (7-15 digits),
 *   intended_move_in_date (valid future date), message (optional)
 */
export default function ApplicationForm({ apartmentId, apartmentTitle }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    intended_move_in_date: '',
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
    if (!formData.intended_move_in_date) {
      clientErrors.push('An intended move-in date is required.');
    } else {
      const date = new Date(formData.intended_move_in_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        clientErrors.push('Intended move-in date must be today or a future date.');
      }
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitApplication({
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
        <strong>Application submitted.</strong> {success}
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
        <label htmlFor="app-full-name" className="enquiry-form__label">Full name *</label>
        <input
          id="app-full-name"
          type="text"
          className="enquiry-form__input"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="app-email" className="enquiry-form__label">Email *</label>
        <input
          id="app-email"
          type="email"
          className="enquiry-form__input"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="app-phone" className="enquiry-form__label">Phone *</label>
        <input
          id="app-phone"
          type="tel"
          className="enquiry-form__input"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          autoComplete="tel"
          placeholder="e.g. +234 801 234 5678"
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="app-move-in" className="enquiry-form__label">Intended move-in date *</label>
        <input
          id="app-move-in"
          type="date"
          className="enquiry-form__input"
          value={formData.intended_move_in_date}
          onChange={(e) => handleChange('intended_move_in_date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="enquiry-form__field">
        <label htmlFor="app-message" className="enquiry-form__label">Message (optional)</label>
        <textarea
          id="app-message"
          className="enquiry-form__input enquiry-form__textarea"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" variant="brass" loading={submitting} className="enquiry-form__submit">
        {submitting ? 'Submitting...' : 'Submit application'}
      </Button>
    </form>
  );
}
