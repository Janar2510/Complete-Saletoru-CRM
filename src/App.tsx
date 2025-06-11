import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PlanProvider } from './contexts/PlanContext';
import { DevModeProvider } from './contexts/DevModeContext';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import Contacts from './pages/Contacts';
import Organizations from './pages/Organizations';
import Offers from './pages/Offers';
import EmailTemplates from './pages/EmailTemplates';
import Settings from './pages/Settings';
import Marketplace from './pages/Marketplace';
import Pricing from './pages/Pricing';
import LeadScoring from './pages/LeadScoring';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Notifications from './pages/Notifications';
import { NotificationToastContainer } from './components/notifications/NotificationToastContainer';
import Calendar from './pages/Calendar';
import Emails from './pages/Emails';
import Products from './pages/Products';
import Activities from './pages/Activities';
import Analytics from './pages/Analytics';
import DebugTools from './pages/DebugTools';
import Tasks from './pages/Tasks';

function App() {
  return (
    <DevModeProvider>
      <AuthProvider>
        <PlanProvider>
          <Router>
            {/* Notification Toast Container */}
            <NotificationToastContainer />
            
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              {/* Public Routes */}
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/deals" element={<Layout><Deals /></Layout>} />
              <Route path="/contacts" element={<Layout><Contacts /></Layout>} />
              <Route path="/organizations" element={<Layout><Organizations /></Layout>} />
              <Route path="/offers" element={<Layout><Offers /></Layout>} />
              <Route path="/email-templates" element={<Layout><EmailTemplates /></Layout>} />
              <Route path="/activities" element={<Layout><Activities /></Layout>} />
              <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
              <Route path="/emails" element={<Layout><Emails /></Layout>} />
              <Route path="/leads" element={<Layout><Leads /></Layout>} />
              <Route path="/products" element={<Layout><Products /></Layout>} />
              <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />
              <Route path="/lead-scoring" element={<Layout><LeadScoring /></Layout>} />
              <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
              <Route path="/debug-tools" element={<Layout><DebugTools /></Layout>} />
              <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PlanProvider>
      </AuthProvider>
    </DevModeProvider>
  );
}

export default App;