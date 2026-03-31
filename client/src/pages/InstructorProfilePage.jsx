import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { instructorAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

const InstructorProfilePage = () => {
  const { id } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    instructorAPI.getOne(id)
      .then(res => setInstructor(res.data.instructor))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (notFound) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-6xl mb-4">🔍</div>
      <p className="text-lg font-medium">Instructor not found</p>
      <Link to="/instructors" className="btn-primary mt-4 inline-block">Back to Instructors</Link>
    </div>
  );

  const { socialLinks = {} } = instructor;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header card */}
      <div className="card sm:flex gap-8 mb-6">
        <div className="flex-shrink-0 flex justify-center sm:block mb-4 sm:mb-0">
          {instructor.photo ? (
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="w-36 h-36 rounded-2xl object-cover ring-4 ring-primary-100"
            />
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-primary-100 flex items-center justify-center text-5xl font-bold text-primary-600">
              {instructor.name[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{instructor.name}</h1>
          <p className="text-primary-600 font-semibold text-lg mt-1">{instructor.title}</p>
          {instructor.experience && (
            <p className="text-gray-400 text-sm mt-1">{instructor.experience}+ years of experience</p>
          )}

          {instructor.expertise?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {instructor.expertise.map((tag) => (
                <span key={tag} className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          {Object.values(socialLinks).some(Boolean) && (
            <div className="flex gap-3 mt-4">
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="LinkedIn">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors" title="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              )}
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" title="Website">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {(instructor.detailedBio || instructor.shortBio) && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">About</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {instructor.detailedBio || instructor.shortBio}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Qualifications */}
        {instructor.qualifications?.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Education</h2>
            <ul className="space-y-2">
              {instructor.qualifications.map((q) => (
                <li key={q} className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="mt-0.5 text-primary-500">🎓</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Achievements */}
        {instructor.achievements?.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Achievements</h2>
            <ul className="space-y-2">
              {instructor.achievements.map((a) => (
                <li key={a} className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="mt-0.5 text-yellow-500">🏆</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link to="/instructors" className="btn-secondary">← All Instructors</Link>
        <Link to="/sessions" className="btn-primary">Browse Sessions</Link>
      </div>
    </div>
  );
};

export default InstructorProfilePage;
