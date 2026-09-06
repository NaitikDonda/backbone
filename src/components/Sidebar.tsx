import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/overview', icon: '○' },
  { name: 'Health Journey', path: '/journey', icon: '◇' },
  { name: 'Records', path: '/records', icon: '□' },
  { name: 'Insights', path: '/signals', icon: '◈' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border-light flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border-light">
        <NavLink
          to="/"
          className="text-h2 text-text-primary font-semibold tracking-tight hover:text-text-secondary transition-colors duration-base"
        >
          BACKBONE
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-base ${
                    isActive
                      ? 'bg-accent-light text-accent-primary'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border-light">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-all duration-base"
        >
          <span className="text-lg">⚙</span>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
