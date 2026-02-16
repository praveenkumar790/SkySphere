import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { useMissionMonitor } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Activity, Battery, BatteryCharging, BatteryWarning, Signal, MapPin, Gauge, Pause, Play, Square, Timer, Settings } from 'lucide-react';


export default function MissionMonitor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const executionId = searchParams.get('executionId');
  const navigate = useNavigate();
  
  const [execution, setExecution] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { telemetry, connected, lastEvent } = useMissionMonitor(executionId);
  
  const mapRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<any>(null); // Changed to any to support CircleMarker
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const pathCoordsRef = useRef<[number, number][]>([]);
  
  
  const [isLaunching, setIsLaunching] = useState(false);

  // ... (handleLaunch logic remains same)

  useEffect(() => {
    if (executionId && telemetry) {
      updateMap();
    }
  }, [telemetry, executionId]);

  // Listen for mission completion to update status
  useEffect(() => {
    if (lastEvent?.type === 'mission:completed') {
        fetchExecution();
    }
  }, [lastEvent]);

  // Derived state for display
  const isCompleted = execution?.status === 'completed';
  const displayProgress = isCompleted ? 100 : (telemetry?.progress || 0);
  const displayEta = isCompleted ? 0 : (telemetry?.eta || 0);
  const displayBattery = telemetry?.battery || 0;
  const displaySpeed = telemetry?.speed || 0;
  const displayAltitude = telemetry?.position?.altitude || 0;
  const displayWaypointCurrent = isCompleted ? (telemetry?.totalWaypoints || 0) : (telemetry?.currentWaypoint || 0);
  const displayWaypointTotal = telemetry?.totalWaypoints || 0;

  const updateMap = () => {
      if (!mapRef.current || !telemetry) return;
      
      const pos: [number, number] = [telemetry.position.lat, telemetry.position.lng];
      
      if (!droneMarkerRef.current) {
          // Simple marker for drone
          droneMarkerRef.current = L.circleMarker(pos, { 
              radius: 8, 
              color: '#f59e0b', 
              fillColor: '#f59e0b',
              fillOpacity: 0.8 
          }).addTo(mapRef.current).bindPopup('Drone');
      } else {
          droneMarkerRef.current.setLatLng(pos);
      }
  };

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      // 1. Get available drones
      const dronesRes = await api.get('/drones?status=available&minBattery=20');
      const drones = dronesRes.data;
      
      if (drones.length === 0) {
        alert('No available drones with sufficient battery found.');
        return;
      }
      
      // 2. Select first available drone (or implement selection UI)
      const selectedDrone = drones[0];
      
      // 3. Create execution
      const executionRes = await api.post(`/missions/${mission.id}/execute`, {
        droneId: selectedDrone.id
      });
      
      // 4. Navigate to execution view
      navigate(`/missions/${mission.id}/monitor?executionId=${executionRes.data.executionId}`);
    } catch (error) {
      console.error('Failed to launch mission:', error);
      alert('Failed to launch mission. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };
  


  useEffect(() => {
    if (id) {
      fetchExecution();
    }
  }, [id, executionId]);

  useEffect(() => {
    console.log('MissionMonitor: Mission data changed', mission);
    // Initialize map when mission data is available
    if (mission?.waypoints?.length > 0) {
      console.log('MissionMonitor: Has waypoints, checking mapRef', mapRef.current);
      if (!mapRef.current) {
        // Small timeout to ensure DOM is ready
        setTimeout(() => {
          console.log('MissionMonitor: Initializing map...');
          initMap(mission.waypoints);
        }, 100);
      }
    } else {
        console.log('MissionMonitor: No waypoints or mission not loaded');
    }

    return () => {
        if (mapRef.current) {
            console.log('MissionMonitor: Cleaning up map');
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, [mission]);

  const fetchExecution = async () => {
    try {
      setError(null);
      if (executionId) {
        const res = await api.get(`/missions/executions/${executionId}`);
        setExecution(res.data);
        setMission(res.data.mission);
      } else if (id) {
        // Fetch mission details if no execution ID
        console.log('MissionMonitor: Fetching mission', id);
        const res = await api.get(`/missions/${id}`);
        console.log('MissionMonitor: Fetched mission data', res.data);
        setMission(res.data);
        
        // Auto-switch to monitor mode if there's an active execution
        if (res.data.missionExecutions && res.data.missionExecutions.length > 0) {
            const activeExec = res.data.missionExecutions[0];
            console.log('MissionMonitor: Found active execution, switching...', activeExec.id);
            // Update URL without reloading page
            const newUrl = `/missions/${id}/monitor?executionId=${activeExec.id}`;
            // Use navigate with replace to trigger re-render
            navigate(newUrl, { replace: true });
            // Also force set execution ID to trigger effect
            // window.location.search = `?executionId=${activeExec.id}`; 
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Unable to load mission data.');
    }
  };

  const initMap = (waypoints: any[]) => {
    if (!mapRef.current) {
        const map = L.map('mission-monitor-map').setView([waypoints[0].latitude, waypoints[0].longitude], 18);
        mapRef.current = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Fix tiles
        setTimeout(() => map.invalidateSize(), 100);
    }
    
    // Clear existing layers if any (except tile layer)
    mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
             mapRef.current?.removeLayer(layer);
        }
    });
    
    // Reset marker reference since we removed it
    droneMarkerRef.current = null;
    
    // Draw planned path
    const path = waypoints.map(wp => [wp.latitude, wp.longitude] as [number, number]);
    pathCoordsRef.current = path;
    
    pathPolylineRef.current = L.polyline(path, { color: '#3b82f6', weight: 3, dashArray: '10, 10' }).addTo(mapRef.current);
    
    // Fit bounds
    if (path.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(path).pad(0.1));
    }
    
    // Add start/end markers
    if (path.length > 0) {
        L.circleMarker(path[0], { radius: 6, color: '#22c55e', fillOpacity: 1 }).addTo(mapRef.current).bindPopup('Start');
        L.circleMarker(path[path.length - 1], { radius: 6, color: '#ef4444', fillOpacity: 1 }).addTo(mapRef.current).bindPopup('End');
    }
  };



  const handlePause = async () => {
     if (!executionId) return;
     try {
         await api.post(`/missions/executions/${executionId}/pause`);
         fetchExecution();
     } catch (e) {
         console.error(e);
     }
  };
  
  const handleResume = async () => {
     if (!executionId) return;
     try {
         await api.post(`/missions/executions/${executionId}/resume`);
         fetchExecution();
     } catch (e) {
         console.error(e);
     }
  };
   
  const handleAbort = async () => {
     if (!executionId) return;
     try {
         await api.post(`/missions/executions/${executionId}/abort`);
         fetchExecution();
     } catch (e) {
         console.error(e);
     }
  };

  const getBatteryIcon = (level: number) => {
      if (level > 80) return <Battery className="h-3 w-3 text-emerald-500" />;
      if (level > 20) return <BatteryCharging className="h-3 w-3 text-amber-500" />;
      return <BatteryWarning className="h-3 w-3 text-rose-500" />;
  };

  if (!mission) {
    if (error) {
      return (
        <div className="flex h-[50vh] items-center justify-center p-8 text-muted-foreground">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <span>{error}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden relative p-6 gap-6 bg-black/5">
        {/* Map Skeleton */}
        <div className="flex-1 relative h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-[400px] h-full bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          <div>
             <div className="flex justify-between mb-2">
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-5 w-20" />
             </div>
             <Skeleton className="h-5 w-48 mb-2" />
             <Skeleton className="h-4 w-full" />
          </div>

          <div className="space-y-6 flex-1">
             <div className="space-y-3 pb-6 border-b border-white/5">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-10 w-full" />
             </div>

             <div className="space-y-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="grid grid-cols-2 gap-3">
                   <Skeleton className="h-20 w-full rounded-lg" />
                   <Skeleton className="h-20 w-full rounded-lg" />
                   <Skeleton className="h-20 w-full rounded-lg" />
                   <Skeleton className="h-20 w-full rounded-lg" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden relative p-6 gap-6 bg-black/5">
      {/* Map Container */}
      <div className="flex-1 relative h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
        <div id="mission-monitor-map" className="h-full w-full" />
      </div>

      {/* Sidebar Configuration */}
      <div className="w-[400px] h-full bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-y-auto px-6 py-6 shadow-2xl relative z-20 flex flex-col gap-6">
        
        {/* Header Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight text-white/90">Mission Monitor</h2>
            </div>
             {execution && (
                <Badge variant={execution.status === 'in-progress' ? 'default' : 'secondary'} className="uppercase">
                  {execution.status}
                </Badge>
              )}
              {!execution && (
                <Badge variant="outline" className="uppercase">
                  View Mode
                </Badge>
              )}
          </div>
          <h3 className="text-lg font-semibold text-white/80">{mission.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{mission.description}</p>
          
           {execution && (
            execution.status === 'completed' ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Mission Completed
                </div>
            ) : (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-500' : 'text-rose-500'} bg-white/5 p-2 rounded-md border border-white/5`}>
                  <span className={`relative flex h-2 w-2`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </span>
                  {connected ? 'Live Telemetry Active' : 'Telemetry Disconnected'}
                </div>
            )
           )}
        </div>

        <div className="space-y-6 flex-1">
          {/* Controls Section */}
          <div className="space-y-3 pb-6 border-b border-white/5">
             <div className="flex items-center gap-2 pb-2">
                <Settings className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-white/90">Mission Controls</h3>
              </div>
            <div className="grid grid-cols-1 gap-2">
            {!execution || ['completed', 'failed', 'aborted'].includes(execution.status) ? (
               <Button 
                 className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                 onClick={handleLaunch}
                 disabled={isLaunching}
               >
                  {isLaunching ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      {execution ? 'Restarting...' : 'Launching...'}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4 group-hover:scale-105 transition-transform fill-current" />
                      {execution ? 'Restart Mission' : 'Launch Mission'}
                    </>
                  )}
                </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handlePause}
                    disabled={execution.status !== 'in-progress'}
                    variant="outline"
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleResume}
                    disabled={execution.status !== 'paused'}
                    variant="outline"
                    className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                </div>
                <Button
                  onClick={handleAbort}
                  disabled={execution.status === 'completed' || execution.status === 'aborted'}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4 fill-current" />
                  Abort Mission
                </Button>
              </>
            )}
            </div>
          </div>

          {/* Telemetry Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Gauge className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-white/90">Live Telemetry</h3>
            </div>
            
            {telemetry || isCompleted ? (
                <div className="space-y-4">
                  <div className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-emerald-400">{displayProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={displayProgress} className="h-2 bg-white/10" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Timer className="h-3 w-3" />
                        ETA
                      </div>
                      <div className="text-xl font-bold font-mono text-white/90">
                        {Math.floor(displayEta / 60)}<span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {getBatteryIcon(displayBattery)}
                        Battery
                      </div>
                      <div className="text-xl font-bold font-mono text-white/90">
                        {displayBattery.toFixed(0)}<span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Gauge className="h-3 w-3" />
                        Speed
                      </div>
                      <div className="text-xl font-bold font-mono text-white/90">
                        {displaySpeed.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">m/s</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Activity className="h-3 w-3" />
                        Altitude
                      </div>
                      <div className="text-xl font-bold font-mono text-white/90">
                        {displayAltitude.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">m</span>
                      </div>
                    </div>
                  </div>
                  
                   <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Waypoint
                      </div>
                      <span className="text-sm font-medium text-white/90">
                        {displayWaypointCurrent} <span className="text-muted-foreground">/ {displayWaypointTotal}</span>
                      </span>
                    </div>
                    <Progress value={(displayWaypointCurrent / displayWaypointTotal) * 100} className="h-1.5 bg-white/10" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3 bg-white/5 rounded-xl border border-white/5 border-dashed">
                  <Signal className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Waiting for telemetry data...</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
