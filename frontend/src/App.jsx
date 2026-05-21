import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardPage from './pages/BoardPage';
import MyTasks from './pages/MyTasks';
import ProfilePage from './pages/ProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import AppLayout from './layouts/AppLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AppLayout><Dashboard /></AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <PrivateRoute>
                <AppLayout><MyTasks /></AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <AppLayout><ProfilePage /></AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/board/:projectId"
            element={
              <PrivateRoute>
                <AppLayout><BoardPage /></AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <PrivateRoute>
                <AppLayout><DiscoverPage /></AppLayout>
              </PrivateRoute>
            }
          />

          {/* Catch-all: bilinmeyen route'ları ana sayfaya yönlendir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
