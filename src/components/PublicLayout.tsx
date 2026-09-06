import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Features', path: '/features' },
    { name: 'About', path: '/about' },
    { name: 'Privacy', path: '/privacy' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-base ${
          isScrolled
            ? 'bg-surface/95 backdrop-blur-sm border-b border-border-light shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-h2 text-text-primary font-semibold tracking-tight hover:text-text-secondary transition-colors">
              BACKBONE
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-base ${
                    location.pathname === link.path
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/workspace"
                className="btn btn-primary text-sm"
              >
                Open Workspace
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border-light">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors duration-base ${
                      location.pathname === link.path
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/workspace"
                  className="btn btn-primary text-sm text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Open Workspace
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border-light mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-h4 text-text-primary mb-4">BACKBONE</h3>
              <p className="text-body text-text-secondary">
                Reconstructing the story hidden inside years of fragmented medical records.
              </p>
            </div>
            <div>
              <h4 className="text-small font-medium text-text-primary mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/how-it-works" className="text-small text-text-secondary hover:text-text-primary transition-colors">How It Works</Link></li>
                <li><Link to="/features" className="text-small text-text-secondary hover:text-text-primary transition-colors">Features</Link></li>
                <li><Link to="/workspace" className="text-small text-text-secondary hover:text-text-primary transition-colors">Workspace</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-small font-medium text-text-primary mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-small text-text-secondary hover:text-text-primary transition-colors">About</Link></li>
                <li><Link to="/privacy" className="text-small text-text-secondary hover:text-text-primary transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-small font-medium text-text-primary mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border-light">
            <p className="text-small text-text-tertiary">
              © {new Date().getFullYear()} BACKBONE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
