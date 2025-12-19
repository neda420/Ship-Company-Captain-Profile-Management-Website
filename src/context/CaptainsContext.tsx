import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CaptainProfile } from '../types';
import { api } from '../lib/api';

interface CaptainsContextType {
  captains: CaptainProfile[];
  addCaptain: (captain: CaptainProfile) => Promise<CaptainProfile>;
  updateCaptain: (id: string, captain: Partial<CaptainProfile>) => Promise<void>;
  deleteCaptain: (id: string) => Promise<void>;
  reloadCaptains: () => Promise<void>;
}

const CaptainsContext = createContext<CaptainsContextType | undefined>(undefined);

export const CaptainsProvider = ({ children }: { children: ReactNode }) => {
  const [captains, setCaptains] = useState<CaptainProfile[]>([]);

  const reloadCaptains = async () => {
    try {
      const data = await api.get<CaptainProfile[]>('/captains');
      setCaptains(data);
    } catch (err: any) {
      console.error('Failed to load captains:', err.message || err);
      if (err.message?.includes('Cannot connect')) {
        console.error('💡 Make sure the backend server is running on port 4000');
      }
      throw err;
    }
  };

  // Load captains from backend on mount
  useEffect(() => {
    (async () => {
      try {
        // First check if backend is available
        try {
          await fetch('/api/health');
        } catch (healthErr) {
          console.error('⚠️ Backend server is not running. Make sure:');
          console.error('   1. Backend is running on port 4000');
          console.error('   2. Run: npm run dev (from root directory)');
          console.error('   3. Check backend console for errors');
          return;
        }

        await reloadCaptains();
      } catch (err: any) {
        // Error already logged in reloadCaptains
      }
    })();
  }, []);

  const addCaptain = async (captain: CaptainProfile) => {
    try {
      // Add to backend
      const created = await api.post<CaptainProfile>('/captains', {
        fullName: captain.fullName,
        title: captain.title,
        avatarUrl: captain.avatarUrl,
        status: captain.status,
        email: captain.email,
        phone: captain.phone,
        location: captain.location,
        team: captain.team,
        linkedInUrl: captain.linkedInUrl,
        personalIdentity: captain.personalIdentity,
        professionalInfo: captain.professionalInfo,
        medicalInfo: captain.medicalInfo,
        expiryDates: captain.expiryDates,
        seaService: captain.seaServiceHistory,
        certificates: captain.certificates,
        skills: captain.skills,
      });

      // Reload captains from backend to get the full data
      const data = await api.get<CaptainProfile[]>('/captains');
      setCaptains(data);

      return created;
    } catch (err: any) {
      console.error('Failed to add captain:', err);
      throw err;
    }
  };

  const updateCaptain = async (id: string, updates: Partial<CaptainProfile>) => {
    try {
      // Update in backend
      const captain = captains.find(c => c.id === id);
      if (!captain) throw new Error('Captain not found');

      const updatedData = { ...captain, ...updates };
      await api.put(`/captains/${id}`, {
        fullName: updatedData.fullName,
        title: updatedData.title,
        avatarUrl: updatedData.avatarUrl,
        status: updatedData.status,
        email: updatedData.email,
        phone: updatedData.phone,
        location: updatedData.location,
        team: updatedData.team || '',
        linkedInUrl: updatedData.linkedInUrl,
        personalIdentity: updatedData.personalIdentity,
        professionalInfo: updatedData.professionalInfo,
        medicalInfo: updatedData.medicalInfo,
        expiryDates: updatedData.expiryDates,
        seaService: updatedData.seaServiceHistory,
        certificates: updatedData.certificates,
        skills: updatedData.skills,
      });

      // Reload captains from backend to get the updated data
      const data = await api.get<CaptainProfile[]>('/captains');
      setCaptains(data);
    } catch (err: any) {
      console.error('Failed to update captain:', err);
      throw err;
    }
  };

  const deleteCaptain = async (id: string) => {
    try {
      // Delete from backend
      await api.del(`/captains/${id}`);

      // Reload captains from backend
      const data = await api.get<CaptainProfile[]>('/captains');
      setCaptains(data);
    } catch (err: any) {
      console.error('Failed to delete captain:', err);
      throw err;
    }
  };

  const value: CaptainsContextType = {
    captains,
    addCaptain,
    updateCaptain,
    deleteCaptain,
    reloadCaptains,
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

