import { create } from 'zustand';

interface Mission {
  id: string;
  name: string;
  description?: string;
  patternType: string;
  altitude: number;
  overlapPercentage: number;
  speed: number;
  waypoints?: any[];
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  currentLat?: number;
  currentLng?: number;
}

interface MissionStore {
  missions: Mission[];
  drones: Drone[];
  selectedMission: Mission | null;
  setMissions: (missions: Mission[]) => void;
  setDrones: (drones: Drone[]) => void;
  setSelectedMission: (mission: Mission | null) => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  missions: [],
  drones: [],
  selectedMission: null,
  setMissions: (missions) => set({ missions }),
  setDrones: (drones) => set({ drones }),
  setSelectedMission: (mission) => set({ selectedMission: mission }),
}));
