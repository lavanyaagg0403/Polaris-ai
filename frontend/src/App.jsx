import React, { useState, useEffect } from 'react';
import { 
  Compass, LayoutDashboard, MessageSquare, BookOpen, 
  Briefcase, Code, FileText, CheckSquare, Settings as SettingsIcon,
  Star
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import AIHub from './pages/AIHub';
import StudyHub from './pages/StudyHub';
import CareerHub from './pages/CareerHub';
import CodingHub from './pages/CodingHub';
import ResearchHub from './pages/ResearchHub';
import ProductivityHub from './pages/ProductivityHub';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { apiFetch } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [chatLaunch, setChatLaunch] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await apiFetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        setDashboardData(null);
        setFetchError('Polaris could not load dashboard data from the backend.');
        console.error('Dashboard request failed:', res.status);
      }
    } catch (err) {
      console.error('Polaris backend unreachable:', err);
      setDashboardData(null);
      setFetchError('Polaris cannot reach the backend server. Start the backend with npm run dev in the backend folder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const openCommandCenter = (payload = {}) => {
    setChatLaunch({ id: Date.now(), focus: true, ...payload });
    setActiveTab('ai-hub');
  };

  const goHome = () => setActiveTab('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            data={dashboardData}
            refreshData={fetchDashboardStats}
            loading={loading}
            fetchError={fetchError}
            setActiveTab={setActiveTab}
            openCommandCenter={openCommandCenter}
          />
        );
      case 'ai-hub':
        return <AIHub refreshData={fetchDashboardStats} launch={chatLaunch} />;
      case 'study':
        return <StudyHub refreshData={fetchDashboardStats} />;
      case 'career':
        return <CareerHub refreshData={fetchDashboardStats} />;
      case 'coding':
        return <CodingHub refreshData={fetchDashboardStats} />;
      case 'research':
        return <ResearchHub refreshData={fetchDashboardStats} />;
      case 'productivity':
        return <ProductivityHub refreshData={fetchDashboardStats} />;
      case 'settings':
        return <Settings refreshData={fetchDashboardStats} />;
      default:
        return (
          <Dashboard
            data={dashboardData}
            refreshData={fetchDashboardStats}
            loading={loading}
            fetchError={fetchError}
            setActiveTab={setActiveTab}
            openCommandCenter={openCommandCenter}
          />
        );
    }
  };

  const navItems = [
    { id: 'dashboard',    label: 'Home',            icon: LayoutDashboard },
    { id: 'ai-hub',       label: 'Command Center',  icon: MessageSquare },
    { id: 'study',        label: 'Study',           icon: BookOpen },
    { id: 'career',       label: 'Career',          icon: Briefcase },
    { id: 'coding',       label: 'Code',            icon: Code },
    { id: 'research',     label: 'Research',        icon: FileText },
    { id: 'productivity', label: 'Focus',           icon: CheckSquare },
  ];

  return (
    <ErrorBoundary label="app-root" onHome={goHome}>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-inner">
            <div>
              <div className="sidebar-logo">
                <div className="logo-star-ring">
                  <Compass
                    size={22}
                    style={{ color: '#c9a84c', animation: 'spin-slow 30s linear infinite' }}
                  />
                </div>
                <div className="logo-wordmark">
                  <div className="logo-name" style={{ fontSize: '1.55rem' }}>Polaris</div>
                  <div className="logo-tagline" style={{ fontSize: '0.58rem' }}>Your North Star · Student OS</div>
                </div>
              </div>

              <nav aria-label="Main navigation">
                <p className="nav-section-label">Navigate</p>
                <ul className="nav-links">
                  {navItems.map(({ id, label, icon: Icon }) => (
                    <li key={id}>
                      <a
                        className={`nav-item ${activeTab === id ? 'active' : ''}`}
                        onClick={() => setActiveTab(id)}
                        role="button"
                        aria-current={activeTab === id ? 'page' : undefined}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        <span>{label}</span>
                        {activeTab === id && (
                          <Star
                            size={8}
                            fill="#c9a84c"
                            stroke="none"
                            style={{ marginLeft: 'auto', opacity: 0.8 }}
                          />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="sidebar-footer">
              <a
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                role="button"
              >
                <SettingsIcon size={17} strokeWidth={1.8} />
                <span>System</span>
                {activeTab === 'settings' && (
                  <Star size={8} fill="#c9a84c" stroke="none" style={{ marginLeft: 'auto', opacity: 0.8 }} />
                )}
              </a>

              <div className="sidebar-coords">
                89°15′N · True North
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <ErrorBoundary key={activeTab} resetKey={activeTab} label={activeTab} onHome={goHome}>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}
