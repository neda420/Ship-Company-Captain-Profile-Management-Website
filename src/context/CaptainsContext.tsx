import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CaptainProfile } from '../types';
import { mockCaptains as initialCaptains } from '../data/mockData';

interface CaptainsContextType {
  captains: CaptainProfile[];
  addCaptain: (captain: CaptainProfile) => void;
  updateCaptain: (id: string, captain: Partial<CaptainProfile>) => void;
  deleteCaptain: (id: string) => void;
}

const CaptainsContext = createContext<CaptainsContextType | undefined>(undefined);

export const CaptainsProvider = ({ children }: { children: ReactNode }) => {
  const [captains, setCaptains] = useState<CaptainProfile[]>([]);

  // Load captains from localStorage on mount
  useEffect(() => {
    const storedCaptains = localStorage.getItem('captains');
    if (storedCaptains) {
      try {
        setCaptains(JSON.parse(storedCaptains));
      } catch (error) {
        console.error('Error loading captains from localStorage:', error);
        setCaptains(initialCaptains);
      }
    } else {
      setCaptains(initialCaptains);
      localStorage.setItem('captains', JSON.stringify(initialCaptains));
    }
  }, []);

  // Save captains to localStorage whenever it changes
  useEffect(() => {
    if (captains.length > 0) {
      localStorage.setItem('captains', JSON.stringify(captains));
    }
  }, [captains]);

  const addCaptain = (captain: CaptainProfile) => {
    setCaptains(prev => [...prev, captain]);
  };

  const updateCaptain = (id: string, updates: Partial<CaptainProfile>) => {
    setCaptains(prev =>
      prev.map(captain =>
        captain.id === id ? { ...captain, ...updates } : captain
      )
    );
  };

  const deleteCaptain = (id: string) => {
    setCaptains(prev => prev.filter(captain => captain.id !== id));
  };

  const value: CaptainsContextType = {
    captains,
    addCaptain,
    updateCaptain,
    deleteCaptain,
  };

  return <CaptainsContext.Provider value={value}>{children}</CaptainsContext.Provider>;
};

export const useCaptains = () => {
  const context = useContext(CaptainsContext);
  if (context === undefined) {
    throw new Error('useCaptains must be used within a CaptainsProvider');
  }
  return context;
};

