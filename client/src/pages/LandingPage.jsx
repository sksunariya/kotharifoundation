import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { configAPI, categoryAPI, instructorAPI, carouselAPI, reviewAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import HeroCarousel from '../components/HeroCarousel';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      configAPI.getPublic(),
      categoryAPI.getAll(),
      instructorAPI.getAll(),
      carouselAPI.getPublic(),
      reviewAPI.getPublished(),
    ])
      .then(([configRes, catRes, instrRes, carouselRes, reviewRes]) => {
        setConfig(configRes.data.config);
        setCategories(catRes.data.categories);
        setInstructors(instrRes.data.instructors);
        setCarouselSlides(carouselRes.data.slides || []);
        setReviews(reviewRes.data.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* Hero Carousel */}
      {carouselSlides.length > 0 && (
        <section className="bg-gray-100 py-4 sm:py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <HeroCarousel slides={carouselSlides} interval={config?.carouselInterval || 4} />
          </div>
        </section>
      )}

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

      {/* Know Your Instructor — featured single card */}
      {instructors.length > 0 && (() => {
        const ins = instructors[0];
        return (
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">Know Your Instructor</h2>
              <p className="text-center text-gray-500 mb-8 sm:mb-10">Learn directly from an industry expert</p>

              <div className="card sm:flex gap-8 items-start">
                {/* Photo */}
                <div className="flex-shrink-0 flex justify-center sm:block mb-6 sm:mb-0">
                  {ins.photo ? (
                    <img
                      src={ins.photo}
                      alt={ins.name}
                      className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover ring-4 ring-primary-100 shadow-md"
                    />
                  ) : (
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-primary-100 flex items-center justify-center text-6xl font-bold text-primary-600">
                      {ins.name[0]}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{ins.name}</h3>
                    <p className="text-primary-600 font-semibold text-lg mt-0.5">{ins.title}</p>
                    {ins.experience && (
                      <p className="text-sm text-gray-400 mt-1">
                        <span className="font-medium text-gray-600">{ins.experience}+</span> years of industry experience
                      </p>
                    )}
                  </div>

                  {ins.shortBio && (
                    <p className="text-gray-600 leading-relaxed mb-4">{ins.shortBio}</p>
                  )}

                  {/* Expertise */}
                  {ins.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ins.expertise.map(tag => (
                        <span key={tag} className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium border border-primary-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Qualifications + Achievements in two columns */}
                  {(ins.qualifications?.length > 0 || ins.achievements?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      {ins.qualifications?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Education</p>
                          <ul className="space-y-1">
                            {ins.qualifications.map(q => (
                              <li key={q} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-primary-500 mt-0.5">🎓</span>{q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ins.achievements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Highlights</p>
                          <ul className="space-y-1">
                            {ins.achievements.map(a => (
                              <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-yellow-500 mt-0.5">🏆</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social icons */}
                  {ins.socialLinks && Object.values(ins.socialLinks).some(Boolean) && (
                    <div className="flex gap-3 mb-5">
                      {ins.socialLinks.linkedin && (
                        <a href={ins.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="LinkedIn">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {ins.socialLinks.twitter && (
                        <a href={ins.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors" title="Twitter">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      )}
                      {ins.socialLinks.youtube && (
                        <a href={ins.socialLinks.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                      )}
                      {ins.socialLinks.instagram && (
                        <a href={ins.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                      )}
                      {ins.socialLinks.website && (
                        <a href={ins.socialLinks.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" title="Website">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Link to={`/instructors/${ins._id}`} className="btn-primary px-6">
                      View Full Profile
                    </Link>
                    <Link to="/instructors" className="btn-secondary px-6">
                      Meet All Instructors →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

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

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((r) => (
                <div key={r._id} className="card">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <span key={j} className="text-yellow-400">★</span>
                    ))}
                    {Array.from({ length: 5 - r.rating }).map((_, j) => (
                      <span key={j} className="text-gray-300">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{r.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                      {(r.isAdminCreated ? r.reviewerName : r.studentId?.name)?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {r.isAdminCreated ? r.reviewerName : (r.studentId?.name || 'Student')}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {r.isAdminCreated ? r.reviewerRole : r.slotId?.title}
                      </p>
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
