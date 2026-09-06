import { Outlet, Link, useLocation } from 'react-router-dom';

export function WorkspaceLayout() {
  const location = useLocation();

  const navLinks = [
    { name: 'Overview', path: '/workspace/overview' },
    { name: 'Health Journey', path: '/workspace/journey' },
    { name: 'Records', path: '/workspace/records' },
    { name: 'Insights', path: '/workspace/signals' },
    { name: 'Chat', path: '/workspace/chatbot' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Workspace Header */}
      <header className="bg-surface border-b border-border-light">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-h2 text-text-primary font-semibold tracking-tight hover:text-text-secondary transition-colors">
                BACKBONE
              </Link>
              <div className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-base rounded-lg ${
                      location.pathname === link.path || (location.pathname === '/workspace' && link.path === '/workspace/overview')
                        ? 'bg-background text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/workspace/settings"
              className={`px-4 py-2 text-sm font-medium transition-colors duration-base rounded-lg ${
                location.pathname === '/workspace/settings'
                  ? 'bg-background text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
