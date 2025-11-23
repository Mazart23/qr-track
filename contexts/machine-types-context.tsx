import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMachineTypes } from '@/lib/database';

interface MachineType {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

interface MachineTypesContextType {
  machineTypes: MachineType[];
  refreshMachineTypes: () => Promise<void>;
  getMachineTypeById: (id: number) => MachineType | undefined;
}

const MachineTypesContext = createContext<MachineTypesContextType | undefined>(undefined);

export function MachineTypesProvider({ children }: { children: ReactNode }) {
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);

  const refreshMachineTypes = async () => {
    const types = await getMachineTypes();
    setMachineTypes(types);
  };

  const getMachineTypeByIdLocal = (id: number) => {
    return machineTypes.find(t => t.id === id);
  };

  useEffect(() => {
    refreshMachineTypes();
  }, []);

  return (
    <MachineTypesContext.Provider value={{ machineTypes, refreshMachineTypes, getMachineTypeById: getMachineTypeByIdLocal }}>
      {children}
    </MachineTypesContext.Provider>
  );
}

export function useMachineTypes() {
  const context = useContext(MachineTypesContext);
  if (!context) {
    throw new Error('useMachineTypes must be used within MachineTypesProvider');
  }
  return context;
}
