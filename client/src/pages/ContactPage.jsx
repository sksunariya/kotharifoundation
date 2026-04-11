import { useState } from 'react';
import { queryAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      await queryAPI.submit(form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Query Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Thank you for reaching out. We've received your query and will get back to you as soon as possible.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setForm({ name: '', email: '', phone: '', subject: '', message: '' }); setSubmitted(false); }}
              className="btn-secondary"
            >
              Submit Another
            </button>
            <a href="/" className="btn-primary">Go Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-10">
        <span className="text-4xl">💬</span>
        <h1 className="text-3xl font-bold text-gray-800 mt-3">Contact Us</h1>
        <p className="text-gray-500 mt-2">Have a question or need help? Fill out the form and we'll get back to you.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="What is this about?"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea
              className="input"
              rows={5}
              placeholder="Describe your query in detail..."
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              required
              minLength={10}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.message.length}/2000</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Submitting...' : 'Submit Query'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
