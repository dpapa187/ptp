/**
 * Web Vitals Performance Monitoring
 * 
 * This file provides performance monitoring capabilities for your application.
 * It measures key metrics that Google uses to evaluate user experience and
 * can help you optimize your application's performance over time.
 * 
 * The metrics tracked include:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Interactivity
 * - FCP (First Contentful Paint): Loading performance
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 */

const reportWebVitals = (onPerfEntry) => {
  // Only load the web-vitals library if a callback function is provided
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cumulative Layout Shift (CLS)
      // Measures visual stability - lower is better
      // Good: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
      getCLS((metric) => {
        const enhancedMetric = {
          ...metric,
          category: 'Web Vitals',
          description: 'Cumulative Layout Shift - measures visual stability',
          threshold: metric.value < 0.1 ? 'good' : metric.value < 0.25 ? 'needs-improvement' : 'poor'
        };
        onPerfEntry(enhancedMetric);
      });

      // First Input Delay (FID)
      // Measures interactivity - lower is better
      // Good: < 100ms, Needs improvement: 100-300ms, Poor: > 300ms
      getFID((metric) => {
        const enhancedMetric = {
          ...metric,
          category: 'Web Vitals',
          description: 'First Input Delay - measures interactivity',
          threshold: metric.value < 100 ? 'good' : metric.value < 300 ? 'needs-improvement' : 'poor'
        };
        onPerfEntry(enhancedMetric);
      });

      // First Contentful Paint (FCP)
      // Measures loading performance - lower is better
      // Good: < 1.8s, Needs improvement: 1.8-3s, Poor: > 3s
      getFCP((metric) => {
        const enhancedMetric = {
          ...metric,
          category: 'Web Vitals',
          description: 'First Contentful Paint - measures loading performance',
          threshold: metric.value < 1800 ? 'good' : metric.value < 3000 ? 'needs-improvement' : 'poor'
        };
        onPerfEntry(enhancedMetric);
      });

      // Largest Contentful Paint (LCP)
      // Measures loading performance - lower is better
      // Good: < 2.5s, Needs improvement: 2.5-4s, Poor: > 4s
      getLCP((metric) => {
        const enhancedMetric = {
          ...metric,
          category: 'Web Vitals',
          description: 'Largest Contentful Paint - measures loading performance',
          threshold: metric.value < 2500 ? 'good' : metric.value < 4000 ? 'needs-improvement' : 'poor'
        };
        onPerfEntry(enhancedMetric);
      });

      // Time to First Byte (TTFB)
      // Measures server response time - lower is better
      // Good: < 600ms, Needs improvement: 600-1s, Poor: > 1s
      getTTFB((metric) => {
        const enhancedMetric = {
          ...metric,
          category: 'Web Vitals',
          description: 'Time to First Byte - measures server response time',
          threshold: metric.value < 600 ? 'good' : metric.value < 1000 ? 'needs-improvement' : 'poor'
        };
        onPerfEntry(enhancedMetric);
      });
    }).catch((error) => {
      console.warn('Failed to load web-vitals library:', error);
    });
  }
};

// Enhanced reporting function with additional context
export const reportEnhancedWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Add environment and user context to metrics
    const addContext = (metric) => {
      const enhancedMetric = {
        ...metric,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null,
        environment: process.env.NODE_ENV
      };
      
      onPerfEntry(enhancedMetric);
    };

    // Use the enhanced callback with the standard reportWebVitals function
    reportWebVitals(addContext);
  }
};

// Function to send metrics to an analytics endpoint
export const sendToAnalytics = (metric) => {
  // Only send metrics in production to avoid cluttering development data
  if (process.env.NODE_ENV === 'production') {
    // Example implementation for sending to your analytics service
    // Replace this with your actual analytics endpoint
    
    const analyticsData = {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_id: metric.id,
      threshold: metric.threshold,
      timestamp: metric.timestamp || Date.now(),
      page_url: window.location.href,
      user_agent: navigator.userAgent.substring(0, 200), // Truncate for storage efficiency
      viewport: metric.viewport,
      connection_type: metric.connection?.effectiveType || 'unknown'
    };

    // Send to your analytics service
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
    }).catch((error) => {
      // Don't throw errors for analytics failures
      console.warn('Failed to send analytics:', error);
    });
  }
};

// Function to log metrics to console in a readable format
export const logWebVitals = (metric) => {
  const emoji = metric.threshold === 'good' ? '✅' : metric.threshold === 'needs-improvement' ? '⚠️' : '❌';
  
  console.group(`${emoji} ${metric.name} - ${metric.threshold}`);
  console.log(`Value: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`);
  console.log(`Description: ${metric.description}`);
  if (metric.delta) {
    console.log(`Delta: ${metric.delta.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`);
  }
  console.log(`ID: ${metric.id}`);
  if (metric.connection) {
    console.log(`Connection: ${metric.connection.effectiveType} (${metric.connection.downlink}Mbps)`);
  }
  console.groupEnd();
};

// Default export for backward compatibility
export default reportWebVitals;

// Performance observer for custom metrics
export const observeCustomMetrics = () => {
  // Measure time to interactive
  if ('PerformanceObserver' in window) {
    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const customMetrics = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              responseTime: entry.responseEnd - entry.requestStart
            };
            
            console.log('Navigation Metrics:', customMetrics);
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log slow resources (>1 second)
          if (entry.duration > 1000) {
            console.warn(`Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe long tasks (performance bottlenecks)
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms at ${entry.startTime.toFixed(2)}ms`);
        });
      });
      
      if ('PerformanceLongTaskTiming' in window) {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
      
    } catch (error) {
      console.warn('Performance observation not available:', error);
    }
  }
};

// Initialize performance monitoring when this module is imported
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only observe custom metrics in development for debugging
  observeCustomMetrics();
}
