import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/overview' },
  { name: 'Journey', path: '/journey' },
  { name: 'Records', path: '/records' },
  { name: 'Insights', path: '/signals' }, // Route stays /signals for now, will rename later
  { name: 'Chat', path: '/chatbot' },
];

export function Navigation() {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className="text-xl font-semibold tracking-tight text-text-primary"
            >
              BACKBONE
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center">
            <NavLink
              to="/settings"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200"
            >
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
