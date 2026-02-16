import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Save, Settings, Map as MapIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface LatLng {
  lat: number;
  lng: number;
}

interface Waypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  order: number;
}

export default function MissionPlanning() {
  const [polygonCoords, setPolygonCoords] = useState<LatLng[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [config, setConfig] = useState({
    pattern: 'crosshatch',
    altitude: 50,
    overlap: 30,
    speed: 5,
    angle: 0,
    distanceFromEdge: 10,
    gridSize: 25
  });
  const [missionName, setMissionName] = useState('');
  const [missionDescription, setMissionDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const waypointsLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map('mission-planning-map').setView([37.7749, -122.4194], 13);
      mapRef.current = map;
      
      // Add tile layers
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
      
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // Add default layer
      osm.addTo(map);

      // Add layer control
      const baseMaps = {
        "Standard": osm,
        "Satellite": satellite
      };
      
      L.control.layers(baseMaps, undefined, { position: 'bottomright' }).addTo(map);
      
      // Add feature group for drawn items
      drawnItemsRef.current.addTo(map);
      waypointsLayerRef.current.addTo(map);
      
      // Setup Leaflet.draw control with both Polygon and Rectangle
      const drawControl = new (L.Control as any).Draw({
        draw: {
          polygon: {
            allowIntersection: true, // Allow complex shapes
            showArea: true,
            drawError: {
              color: '#ef4444',
              message: '<strong>Error:</strong> Shape edges cannot cross!'
            },
            shapeOptions: {
              color: '#10b981', // emerald-500
              fillOpacity: 0.2
            }
          },
          rectangle: false,
          circle: {
            shapeOptions: {
              color: '#8b5cf6', // violet-500
              fillOpacity: 0.2
            }
          },
          polyline: false,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
          edit: {} // Enable editing with default options
        }
      });
      
      map.addControl(drawControl);
      
      // Handle creation
      map.on('draw:created', (e: any) => {
        let layer = e.layer;
        const type = e.layerType;

        // Convert circle to polygon for consistency
        if (type === 'circle') {
          const circle = layer as L.Circle;
          const origin = circle.getLatLng();
          const radius = circle.getRadius();
          const polys = [];
          
          // Approximate circle with 64 points
          for (let i = 0; i < 64; i++) {
            const angle = (i * 360) / 64;
            const rad = (angle * Math.PI) / 180;
            // Simple approximation (sufficient for visualization/waypoints on small scale)
            // Ideally use a geodesic library, but for visual planning this works
            const lat = origin.lat + (radius / 111320) * Math.cos(rad);
            const lng = origin.lng + (radius / (40075000 * Math.cos(origin.lat * Math.PI / 180) / 360)) * Math.sin(rad);
            polys.push([lat, lng]);
          }
          
          layer = L.polygon(polys as any, { 
            color: '#8b5cf6', 
            fillOpacity: 0.2 
          });
        }
        
        // Remove existing polygon if any (enforce single mission area)
        drawnItemsRef.current.clearLayers();
        drawnItemsRef.current.addLayer(layer);
        updatePolygonCoords(layer);
      });
      
      // Handle edit
      map.on('draw:edited', (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: L.Layer) => {
        updatePolygonCoords(layer);
        });
      });
      
      // Handle delete
      map.on('draw:deleted', () => {
        setPolygonCoords([]);
        setWaypoints([]);
      });
    }

    // Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures it runs only once

  const updatePolygonCoords = (layer: any) => {
    const geoJson = layer.toGeoJSON();
    // Handle both Polygon and Rectangle (which is a Polygon in GeoJSON)
    if (geoJson.geometry && geoJson.geometry.coordinates) {
       const coords = geoJson.geometry.coordinates[0].map(([lng, lat]: [number, number]) => ({
        lat,
        lng
      }));
      setPolygonCoords(coords);
    }
  };

  const handleGenerateWaypoints = async () => {
    if (polygonCoords.length === 0) {
      toast({
        title: "No Area Selected",
        description: "Please draw a polygon on the map first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        polygon: polygonCoords,
        pattern: config.pattern,
        altitude: config.altitude,
        overlap: config.overlap,
        speed: config.speed
      };

      if (config.pattern === 'perimeter') {
        payload.distanceFromEdge = config.distanceFromEdge;
      } else if (config.pattern === 'grid') {
        payload.gridSize = config.gridSize;
      } else if (config.pattern === 'crosshatch') {
        payload.angle = config.angle;
      }

      const res = await api.post('/missions/generate-waypoints', payload);
      setWaypoints(res.data.waypoints);
      
      // Display waypoints on map
      waypointsLayerRef.current.clearLayers();
      const waypointMarkers: L.Marker[] = [];
      const waypointCoords: [number, number][] = [];
      
      res.data.waypoints.forEach((wp: Waypoint) => {
        const marker = L.marker([wp.latitude, wp.longitude], {
          icon: L.divIcon({
            className: 'waypoint-marker',
            html: `<div style="background: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
            iconSize: [10, 10]
          })
        });
        waypointMarkers.push(marker);
        waypointCoords.push([wp.latitude, wp.longitude]);
      });
      
      waypointMarkers.forEach(marker => waypointsLayerRef.current.addLayer(marker));
      
      if (waypointCoords.length > 1) {
        const polyline = L.polyline(waypointCoords, { color: '#3b82f6', weight: 3, opacity: 0.8 });
        waypointsLayerRef.current.addLayer(polyline);
      }
      
      if (mapRef.current && waypointCoords.length > 0) {
        mapRef.current.fitBounds(waypointCoords as any, { padding: [50, 50] });
      }
    } catch (error: any) {
      toast({
        title: "Error Generating Waypoints",
        description: error.response?.data?.message || 'Failed to generate waypoints',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMission = async () => {
    if (!missionName || waypoints.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a mission name and generate waypoints first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/missions', {
        name: missionName,
        description: missionDescription,
        patternType: config.pattern,
        altitude: config.altitude,
        overlapPercentage: config.overlap,
        speed: config.speed,
        polygon: polygonCoords,
        waypoints
      });
      
      toast({
        title: "Mission Created",
        description: "Your mission has been successfully saved.",
        variant: "success",
      });
      navigate('/missions');
    } catch (error: any) {
      toast({
        title: "Error Creating Mission",
        description: error.response?.data?.message || 'Failed to create mission',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearPolygon = () => {
    drawnItemsRef.current.clearLayers();
    setPolygonCoords([]);
    setWaypoints([]);
    waypointsLayerRef.current.clearLayers();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden relative p-6 gap-6 bg-black/5">
      {/* Map Container */}
      <div className="flex-1 relative h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
        <div id="mission-planning-map" className="h-full w-full" />
        
        {polygonCoords.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearPolygon}
            className="absolute top-6 right-6 z-[400] shadow-xl hover:scale-105 transition-transform"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Shape
          </Button>
        )}
      </div>
      
      {/* Sidebar Configuration */}
      <div className="w-[400px] h-full bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-y-auto px-6 py-6 shadow-2xl relative z-20 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapIcon className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-white/90">Mission Planning</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Draw a survey area and configure flight parameters.
          </p>
          
          <div className="bg-white/5 rounded-lg p-3 text-sm border border-white/10">
            <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Drawing Tools</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
                <span className="text-emerald-400 font-medium">Polygon (Click)</span>
              </div>
              <div className="w-px h-4 bg-white/10"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                <span className="text-violet-400 font-medium">Circle (Drag)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-white/90">Configuration</h3>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="missionName">Mission Name</Label>
              <Input
                id="missionName"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                placeholder="Enter unique mission name"
                className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="missionDescription">Description</Label>
              <Textarea
                id="missionDescription"
                value={missionDescription}
                onChange={(e) => setMissionDescription(e.target.value)}
                placeholder="Brief description of the mission objectives"
                rows={3}
                className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pattern">Pattern Type</Label>
              <Select 
                value={config.pattern} 
                onValueChange={(value: string) => setConfig({ ...config, pattern: value })}
              >
                <SelectTrigger id="pattern" className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crosshatch">Crosshatch</SelectItem>
                  <SelectItem value="perimeter">Perimeter</SelectItem>
                  <SelectItem value="grid">Grid (Lawnmower)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="altitude">Altitude (m)</Label>
                <Input
                  id="altitude"
                  type="number"
                  value={config.altitude}
                  onChange={(e) => setConfig({ ...config, altitude: parseFloat(e.target.value) })}
                  min="10"
                  max="150"
                  className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="speed">Speed (m/s)</Label>
                <Input
                  id="speed"
                  type="number"
                  value={config.speed}
                  onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                  min="1"
                  max="20"
                  className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="overlap">Overlap (%)</Label>
                <span className="text-xs text-muted-foreground">{config.overlap}%</span>
              </div>
              <Input
                id="overlap"
                type="range"
                value={config.overlap}
                onChange={(e) => setConfig({ ...config, overlap: parseFloat(e.target.value) })}
                min="0"
                max="90"
                className="cursor-pointer"
              />
            </div>
            
            {config.pattern === 'perimeter' && (
              <div className="grid gap-2">
                <Label htmlFor="distanceFromEdge">Distance from Edge (m)</Label>
                <Input
                  id="distanceFromEdge"
                  type="number"
                  value={config.distanceFromEdge}
                  onChange={(e) => setConfig({ ...config, distanceFromEdge: parseFloat(e.target.value) })}
                  min="5"
                  max="50"
                  className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
                />
              </div>
            )}
            
            {config.pattern === 'grid' && (
              <div className="grid gap-2">
                <Label htmlFor="gridSize">Grid Size (m)</Label>
                <Input
                  id="gridSize"
                  type="number"
                  value={config.gridSize}
                  onChange={(e) => setConfig({ ...config, gridSize: parseFloat(e.target.value) })}
                  min="10"
                  max="100"
                  className="bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-white/5">
          <Button
            onClick={handleGenerateWaypoints}
            disabled={loading || polygonCoords.length === 0}
            className="w-full"
            variant="secondary"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapIcon className="mr-2 h-4 w-4" />}
            Generate Waypoints
          </Button>
          
          {waypoints.length > 0 && (
            <div className="flex items-center justify-center p-2 rounded-md bg-emerald-500/10 text-emerald-400 text-sm font-medium">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" style={{ display: 'none' }} /> 
              Ready: {waypoints.length} waypoints generated
            </div>
          )}
          
          <Button
            onClick={handleSaveMission}
            disabled={loading || !missionName || waypoints.length === 0}
            className="w-full"
            style={{
                background: 'linear-gradient(to right, #0ea5e9, #8b5cf6)',
                border: 'none',
                color: 'white',
              }}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Mission Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
