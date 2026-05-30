import React, { useState, useEffect } from 'react';
import DeveloperHub from './components/DeveloperHub';
import ClientWebsite from './components/ClientWebsite';
import BookingCRM from './components/BookingCRM';
import MobileClientApp from './components/MobileClientApp';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Register custom router event listeners
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Full-Screen Isolated Standalone Routing Coordinator
  if (currentPath === '/website') {
    return <ClientWebsite />;
  }
  
  if (currentPath === '/crm') {
    return <BookingCRM />;
  }
  
  if (currentPath === '/app') {
    return <MobileClientApp />;
  }

  // Default renders technical developer portal at root (/)
  return <DeveloperHub />;
}
