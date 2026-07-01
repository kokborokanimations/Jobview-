import React, { useState } from 'react';
import { Mail, User, Heading, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface ContactFormProps {
  onSuccess?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit the contact form.');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setError(err.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-6 text-center space-y-4 my-4 animate-fade-in" id="contact-success-state">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-emerald-950 font-display">Message Sent Successfully!</h4>
          <p className="text-xs text-emerald-700 font-medium">
            Thank you for contacting us. Our recruiter support team or administrators will review your message and get back to you shortly.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2 border-t border-slate-100 pt-4" id="contact-form-component">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Get in Touch with Us</h3>
        <p className="text-[10px] text-slate-500">
          Have an inquiry, feedback, or need help? Fill out the form below and our team will get back to you.
        </p>
      </div>
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Your Name *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <User size={14} />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Mail size={14} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Subject (Optional)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Heading size={14} />
          </span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Inquiry about pricing, jobs, or feedback"
            className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Your Message *</label>
        <div className="relative">
          <span className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
            <MessageSquare size={14} />
          </span>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your query or message in detail..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-600/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-display"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending Message...
          </>
        ) : (
          <>
            <Send size={14} />
            Send Message
          </>
        )}
      </button>
    </form>
  );
};
