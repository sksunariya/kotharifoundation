import { useAuth } from '../context/AuthContext';

const Footer = ({ config }) => {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎓</span>
              <span className="font-bold text-white text-lg">{config?.platformName || 'Kothari Education'}</span>
            </div>
            <p className="text-sm text-gray-400">{config?.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/sessions" className="hover:text-white transition-colors">Browse Sessions</a></li>
              <li><a href="/booking-status" className="hover:text-white transition-colors">Check Booking Status</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
              {!isAuthenticated && (
                <li><a href="/register" className="hover:text-white transition-colors">Create Account</a></li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              {config?.supportEmail && (
                <li>📧 <a href={`mailto:${config.supportEmail}`} className="hover:text-white transition-colors">{config.supportEmail}</a></li>
              )}
              {config?.supportPhone && (
                <li>📞 {config.supportPhone}</li>
              )}
            </ul>
            {config?.verificationTimeNote && (
              <p className="text-xs text-gray-500 mt-3">{config.verificationTimeNote}</p>
            )}
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500 space-y-2">
          <div>{config?.footerText || '© 2024 Kothari Foundation. All rights reserved.'}</div>
          <div>
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
