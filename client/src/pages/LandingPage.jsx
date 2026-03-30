import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { configAPI, categoryAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([configAPI.getPublic(), categoryAPI.getAll()])
      .then(([configRes, catRes]) => {
        setConfig(configRes.data.config);
        setCategories(catRes.data.categories);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {config?.heroTitle || 'Book a Session With Expert Mentors'}
          </h1>
          <p className="text-lg md:text-xl text-primary-200 mb-10 max-w-2xl mx-auto">
            {config?.heroSubtitle || 'Choose from a wide range of mentorship categories and book your slot today'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sessions" className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors text-lg">
              Browse Sessions
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg">
                Get Started Free
              </Link>
            )}
          </div>
          {config?.verificationTimeNote && (
            <p className="text-primary-300 text-sm mt-6">ℹ️ {config.verificationTimeNote}</p>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-10 sm:mb-12">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: '1', icon: '🔍', title: 'Browse Sessions', desc: 'Explore categories and find the session that fits your needs' },
              { step: '2', icon: '📅', title: 'Book a Slot', desc: 'Select a time slot and fill in your details' },
              { step: '3', icon: '💳', title: 'Pay via UPI', desc: 'Scan the QR code and pay with any UPI app. Submit UTR proof.' },
              { step: '4', icon: '🎓', title: 'Get Meet Link', desc: 'After payment verification, receive your Google Meet link via email' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  {item.icon}
                </div>
                <div className="text-primary-600 font-bold text-sm mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-3">Session Categories</h2>
            <p className="text-center text-gray-500 mb-10 sm:mb-12">Choose from our wide range of mentorship areas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/sessions?category=${cat._id}`}
                  className="card hover:shadow-md hover:border-primary-200 transition-all group"
                >
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-bold text-gray-800 mb-1 group-hover:text-primary-600">{cat.name}</h3>
                  {cat.description && <p className="text-gray-500 text-sm">{cat.description}</p>}
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/sessions" className="btn-primary px-8 py-3 text-base">
                View All Sessions →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {config?.testimonials?.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {config.testimonials.map((t, i) => (
                <div key={i} className="card">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating || 5 }).map((_, j) => (
                      <span key={j} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                      {t.role && <p className="text-gray-500 text-xs">{t.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          {isAuthenticated ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Welcome Back!</h2>
              <p className="text-primary-200 mb-8 text-base sm:text-lg">Explore upcoming sessions and keep growing</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/sessions" className="bg-white text-primary-700 font-bold px-10 py-3 rounded-xl hover:bg-primary-50 transition-colors text-lg inline-block">
                  Browse Sessions
                </Link>
                <Link to="/my-bookings" className="border-2 border-white text-white font-bold px-10 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg inline-block">
                  My Bookings
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-primary-200 mb-8 text-base sm:text-lg">Join hundreds of students who have benefited from expert mentorship</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register" className="bg-white text-primary-700 font-bold px-10 py-3 rounded-xl hover:bg-primary-50 transition-colors text-lg inline-block">
                  Create Free Account
                </Link>
                <Link to="/sessions" className="border-2 border-white text-white font-bold px-10 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg inline-block">
                  Browse Sessions
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
