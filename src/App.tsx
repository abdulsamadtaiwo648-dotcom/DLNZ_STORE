/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Collections } from './pages/Collections';
import { ProductDetail } from './pages/ProductDetail';
import { About } from './pages/About';
import { Tracking } from './pages/Tracking';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnimatePresence } from 'motion/react';

import { FirebaseProvider } from './components/FirebaseProvider';
import { CartProvider } from './components/CartProvider';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <Router>
      <FirebaseProvider>
        <CartProvider>
          <ScrollToTop />
          <Layout>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Routes>
            </AnimatePresence>
          </Layout>
        </CartProvider>
      </FirebaseProvider>
    </Router>
  );
}
