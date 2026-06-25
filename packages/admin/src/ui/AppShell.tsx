import type { UserPublic } from '@devocional/shared';
import type { IconType } from 'react-icons';
import { LuLayoutDashboard, LuMail, LuPencil, LuSparkles, LuSprout, LuUsers } from 'react-icons/lu';
import { NavLink, Outlet } from 'react-router-dom';

import { useTheme } from '../lib/theme.js';
import { Button } from './Button.js';
import { ThemeToggle } from './ThemeToggle.js';

const NAV: { to: string; label: string; icon: IconType; end: boolean }[] = [
  { to: '/', label: 'Agenda', icon: LuSprout, end: true },
  { to: '/painel', label: 'Painel', icon: LuLayoutDashboard, end: false },
  { to: '/novo', label: 'Novo devocional', icon: LuPencil, end: false },
  { to: '/convites', label: 'Convites', icon: LuMail, end: false },
  { to: '/pessoas', label: 'Pessoas', icon: LuUsers, end: false },
];

export function AppShell({ user, onLogout }: { user: UserPublic; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__mark" aria-hidden>
            <LuSparkles />
          </span>
          Devocional
        </div>

        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <span className="nav-link__icon" aria-hidden>
                <item.icon />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__foot">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <span className="sidebar__user">
            <strong>{user.name}</strong>
            Administração
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </aside>

      <main className="content">
        <div className="content__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
