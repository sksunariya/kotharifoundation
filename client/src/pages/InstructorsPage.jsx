import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { instructorAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

const InstructorsPage = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorAPI.getAll()
      .then(res => setInstructors(res.data.instructors))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Our Instructors</h1>
        <p className="text-gray-500">Learn from professionals with proven expertise</p>
      </div>

      {instructors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <p className="text-lg font-medium">No instructors listed yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {instructors.map((instructor) => (
            <div key={instructor._id} className="card sm:flex gap-6">
              {/* Photo */}
              <div className="flex-shrink-0 flex justify-center sm:block mb-4 sm:mb-0">
                {instructor.photo ? (
                  <img
                    src={instructor.photo}
                    alt={instructor.name}
                    className="w-28 h-28 rounded-xl object-cover ring-4 ring-primary-100"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-xl bg-primary-100 flex items-center justify-center text-4xl font-bold text-primary-600">
                    {instructor.name[0]}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="sm:flex sm:justify-between sm:items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{instructor.name}</h2>
                    <p className="text-primary-600 font-medium">{instructor.title}</p>
                    {instructor.experience && (
                      <p className="text-sm text-gray-400">{instructor.experience}+ years of experience</p>
                    )}
                  </div>
                  {/* Social links */}
                  {instructor.socialLinks && (
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      {instructor.socialLinks.linkedin && (
                        <a href={instructor.socialLinks.linkedin} target="_blank" rel="noreferrer"
                          className="text-gray-400 hover:text-blue-600 transition-colors" title="LinkedIn">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {instructor.socialLinks.twitter && (
                        <a href={instructor.socialLinks.twitter} target="_blank" rel="noreferrer"
                          className="text-gray-400 hover:text-sky-500 transition-colors" title="Twitter">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {instructor.socialLinks.youtube && (
                        <a href={instructor.socialLinks.youtube} target="_blank" rel="noreferrer"
                          className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </a>
                      )}
                      {instructor.socialLinks.website && (
                        <a href={instructor.socialLinks.website} target="_blank" rel="noreferrer"
                          className="text-gray-400 hover:text-gray-700 transition-colors" title="Website">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {instructor.shortBio && (
                  <p className="text-gray-500 text-sm mt-3">{instructor.shortBio}</p>
                )}

                {/* Expertise tags */}
                {instructor.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {instructor.expertise.map((tag) => (
                      <span key={tag} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Qualifications */}
                {instructor.qualifications?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {instructor.qualifications.map((q) => (
                      <span key={q} className="text-xs text-gray-500">🎓 {q}</span>
                    ))}
                  </div>
                )}

                <Link
                  to={`/instructors/${instructor._id}`}
                  className="inline-block mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  View Full Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorsPage;
