import { useState } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  MapPin, 
  Wrench, 
  PlayCircle, 
  CheckCircle2 
} from "lucide-react";

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  currentLat?: number;
  currentLng?: number;
}

interface DroneCardProps {
  drone: Drone;
  onUpdate?: () => void; // Callback to refresh list
}

export default function DroneCard({ drone, onUpdate }: DroneCardProps) {
  const [updating, setUpdating] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in-mission': return 'info';
      case 'maintenance': return 'warning';
      default: return 'secondary';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (updating) return;
    try {
      setUpdating(true);
      await api.put(`/drones/${drone.id}`, { status: newStatus });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 70) return 'text-emerald-500';
    if (battery > 30) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getBatteryIcon = (battery: number) => {
    if (battery > 70) return <Battery className="h-4 w-4 text-emerald-500" />;
    if (battery > 30) return <BatteryCharging className="h-4 w-4 text-amber-500" />;
    return <BatteryWarning className="h-4 w-4 text-rose-500" />;
  };

  return (
    <Card className={`hover:border-primary/50 transition-all ${updating ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{drone.name}</CardTitle>
            <CardDescription>{drone.model}</CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                <Badge variant={getStatusVariant(drone.status) as any} className="cursor-pointer hover:opacity-80">
                  {drone.status}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl text-white">
              <DropdownMenuItem onClick={() => handleStatusChange('available')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Mark Available</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('maintenance')}>
                <Wrench className="mr-2 h-4 w-4 text-amber-500" />
                <span>Maintenance</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in-mission')} disabled>
                <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                <span>In Mission (Auto)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* ... existing content ... */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                {getBatteryIcon(drone.batteryLevel)}
                Battery
              </span>
              <span className={`font-medium ${getBatteryColor(drone.batteryLevel)}`}>
                {drone.batteryLevel}%
              </span>
            </div>
            <div className="w-full rounded-full bg-secondary h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  drone.batteryLevel > 70 ? 'bg-emerald-500' :
                  drone.batteryLevel > 30 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${drone.batteryLevel}%` }}
              />
            </div>
          </div>

          {drone.currentLat && drone.currentLng && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/5">
              <MapPin className="h-3 w-3" />
              <span>
                {drone.currentLat.toFixed(4)}, {drone.currentLng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
