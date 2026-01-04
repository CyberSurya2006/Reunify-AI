import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Report } from './pages/Report';
import { MatchDetails } from './pages/MatchDetails';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { ItemDetails } from './pages/ItemDetails';
import { Login } from './pages/Login';
import { Browse } from './pages/Browse';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { ItemsProvider } from './contexts/ItemsContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ItemsProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/report/:type" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                <Route path="/match/:id" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
                <Route path="/item/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
                <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </NotificationProvider>
      </ItemsProvider>
    </AuthProvider>
  );
};

export default App;