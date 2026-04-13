import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" onClick={close} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-lg sm:text-xl text-primary-700">Kothari Education</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/sessions" className="text-gray-600 hover:text-primary-600 font-medium text-sm">
              Browse Sessions
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary-600 font-medium text-sm">
              Contact Us
            </Link>
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-600 hover:text-primary-600 font-medium text-sm">
                    Admin Panel
                  </Link>
                )}
                <Link to="/my-bookings" className="text-gray-600 hover:text-primary-600 font-medium text-sm">
                  My Bookings
                </Link>
                <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-md">
          <Link to="/sessions" onClick={close} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Browse Sessions
          </Link>
          <Link to="/booking-status" onClick={close} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Check Status
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-bookings" onClick={close} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                My Bookings
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={close} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Admin Panel
                </Link>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="px-3 py-1 text-xs text-gray-400">{user?.name} · {user?.email}</p>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link to="/login" onClick={close} className="btn-secondary text-sm py-2 flex-1 text-center">Login</Link>
              <Link to="/register" onClick={close} className="btn-primary text-sm py-2 flex-1 text-center">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
