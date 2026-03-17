import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, Settings } from './types';
import { api } from './lib/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Users from './pages/Users';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';

interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
  settings: Settings | null;
  refreshSettings: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [settings, setSettings] = useState<Settings | null>(null);

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data.favicon) {
        let link: any = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = data.favicon;
      }
    } catch (e) {
      console.error('Failed to load settings');
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const login = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, settings, refreshSettings }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<SettingsPage />} />
              </>
            )}
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
