/**
 * React Application Entry Point
 * 
 * This file serves as the main entry point for your React application.
 * It's responsible for rendering your App component into the DOM and
 * setting up any global configurations or providers your app needs.
 * 
 * Think of this as the ignition system that starts your entire application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create the root element where your React application will be mounted
// This uses React 18's new createRoot API for better performance
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your application with React.StrictMode enabled
// StrictMode helps identify potential problems in your application during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Measure and report web vitals for performance monitoring
// You can send these metrics to an analytics endpoint to track real user performance
reportWebVitals((metric) => {
  // In production, you might want to send these to an analytics service
  // For now, we'll just log them in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }
  
  // Example of how you might send metrics to an analytics service:
  // if (process.env.NODE_ENV === 'production') {
  //   // Send to your analytics service
  //   fetch('/api/analytics', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(metric)
  //   });
  // }
});

// Service Worker Registration (optional)
// Uncomment the following code if you want to enable offline functionality
// and faster loading for returning visitors

/*
// Register service worker for Progressive Web App functionality
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
*/

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // In production, you might want to send these errors to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(event.reason);
  }
  
  // Prevent the default browser behavior (console error)
  event.preventDefault();
});

// Global error handling for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error);
  
  // In production, you might want to send these errors to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(event.error);
  }
});

// Performance monitoring setup (optional)
// This helps you understand how your application performs for real users
if (process.env.NODE_ENV === 'production') {
  // Example: Initialize performance monitoring
  // performanceMonitoring.init({
  //   apiKey: process.env.REACT_APP_PERFORMANCE_API_KEY,
  //   appName: 'Prompt to Profits AI'
  // });
}