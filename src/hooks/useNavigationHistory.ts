import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useNavigationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    // Add current path to history if it's not the last one
    const currentPath = location.pathname;
    const lastPath = historyRef.current[historyRef.current.length - 1];
    
    if (currentPath !== lastPath) {
      historyRef.current.push(currentPath);
      // Keep only last 10 paths to avoid memory issues
      if (historyRef.current.length > 10) {
        historyRef.current.shift();
      }
    }
  }, [location.pathname]);

  const goBack = () => {
    if (historyRef.current.length > 1) {
      // Remove current path
      historyRef.current.pop();
      // Get previous path
      const previousPath = historyRef.current[historyRef.current.length - 1];
      navigate(previousPath || '/');
    } else {
      // If no history, go to dashboard
      navigate('/');
    }
  };

  const canGoBack = historyRef.current.length > 1;

  return { goBack, canGoBack, history: historyRef.current };
};

