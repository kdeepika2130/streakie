import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinks = !isAuthenticated
    ? [{ to: '/', label: 'Home' }]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/circles', label: 'Circles' },
        { to: '/map', label: 'Map' },
      ];

  const dropdownItems = isAuthenticated ? [
    { to: '/profile', label: 'Profile', icon: <User size={18} /> },
    { onClick: handleLogout, label: 'Logout', icon: <LogOut size={18} /> },
  ] : [];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-gradient-to-r from-primary-50/80 to-neutral-50/80 backdrop-blur-md py-3'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <Link to="/" className="flex items-center" aria-label="StreakMates Home">
            <span className="font-display font-bold text-xl text-neutral-900 tracking-tight">
              StreakMates <span className="text-primary-600">🔥</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-neutral-700 hover:text-primary-600 font-medium transition-colors ${location.pathname === to ? 'text-primary-600 font-semibold' : ''
                  }`}
                aria-current={location.pathname === to ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 text-neutral-700 hover:text-primary-600 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-label="User menu"
                >
                  <span className="truncate max-w-[120px]">{user?.name || 'User'}</span>
                </button>
                {isMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-elevated py-2 z-50 border border-neutral-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {dropdownItems.map(({ to, onClick, label, icon }, index) => (
                      to ? (
                        <Link
                          key={index}
                          to={to}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-600"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {icon}
                          {label}
                        </Link>
                      ) : (
                        <button
                          key={index}
                          onClick={() => { onClick(); setIsMenuOpen(false); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-600 w-full text-left"
                        >
                          {icon}
                          {label}
                        </button>
                      )
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-neutral-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-neutral-700 hover:text-primary-600 p-2 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-white fixed inset-x-0 top-14 z-30 border-t border-neutral-100 shadow-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors ${location.pathname === to ? 'bg-primary-50 text-primary-600' : ''
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={location.pathname === to ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <div className="border-t border-neutral-200 my-2" />
                    <div className="px-4 py-2">
                      <p className="font-medium text-neutral-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    {dropdownItems.map(({ to, onClick, label, icon }, index) => (
                      to ? (
                        <Link
                          key={index}
                          to={to}
                          className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {icon}
                          {label}
                        </Link>
                      ) : (
                        <button
                          key={index}
                          onClick={() => { onClick(); setIsMenuOpen(false); }}
                          className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg w-full text-left"
                        >
                          {icon}
                          {label}
                        </button>
                      )
                    ))}
                  </>
                ) : (
                  <>
                    <div className="border-t border-neutral-200 my-2" />
                    <Link
                      to="/login"
                      className="px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex justify-center mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

export default Navbar;