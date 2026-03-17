import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Settings, 
  UserCircle, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export default function Layout() {
  const { user, logout, settings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/records', label: 'Registros', icon: ClipboardList },
    { path: '/profile', label: 'Perfil', icon: UserCircle },
  ];

  if (user?.role === 'admin') {
    navItems.push(
      { path: '/users', label: 'Usuários', icon: Users },
      { path: '/settings', label: 'Configurações', icon: Settings }
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" className="h-8 w-auto" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          )}
          <span className="font-bold text-stone-800">{settings?.system_name || 'Ponto Master'}</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-stone-600">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-stone-200 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={settings.logo} alt="Logo" className="h-10 w-auto" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
            )}
            <div>
              <h1 className="font-bold text-stone-900 leading-tight">{settings?.system_name || 'Ponto Master'}</h1>
              <p className="text-xs text-stone-500 truncate w-32">{settings?.institution_name || 'Instituição'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === item.path
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold">
                  {user?.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 truncate capitalize">{user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                  <span className="font-bold text-stone-800">{settings?.system_name || 'Ponto Master'}</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-stone-400">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    )}
                  >
                    <item.icon size={22} />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-stone-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 text-stone-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                  <LogOut size={22} />
                  Sair do Sistema
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
