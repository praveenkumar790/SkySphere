import { useEffect } from 'react';
import api from '../services/api';
import { useMissionStore } from '../store/missionStore';

export function useMissions() {
  const { setMissions, setDrones } = useMissionStore();

  useEffect(() => {
    // Fetch missions
    api.get('/missions')
      .then((res) => setMissions(res.data))
      .catch((err) => console.error('Failed to fetch missions:', err));

    // Fetch drones
    api.get('/drones')
      .then((res) => setDrones(res.data))
      .catch((err) => console.error('Failed to fetch drones:', err));
  }, [setMissions, setDrones]);
}
