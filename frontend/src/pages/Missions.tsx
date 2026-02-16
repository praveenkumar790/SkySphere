import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Map, Mountain, Layers, Wind, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface Mission {
  id: string;
  name: string;
  description: string;
  status: string;
  waypointCount: number;
  areaSize?: number;
  duration?: number;
  createdAt: string;
  executionId?: string;
  patternType: string;
  altitude: number;
  speed: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  // Default to 'all' (labeled as Planned) as requested
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, [filter]); // Add filter to dependency array to refetch when filter changes

  const fetchMissions = async () => {
    try {
      if (filter === 'all') {
        const res = await api.get('/missions');
        setMissions(res.data);
      } else {
        // For specific statuses, fetch execution history
        const res = await api.get(`/missions/history?status=${filter}`);
        // Map executions to Mission-like objects for the UI
        const mappedMissions = res.data.map((exec: any) => ({
          id: exec.mission.id,
          name: exec.mission.name,
          description: exec.mission.description,
          status: exec.status,
          waypointCount: exec.mission.waypoints?.length || 0,
          createdAt: exec.startedAt, // Show execution start time
          executionId: exec.id,
          patternType: exec.mission.patternType,
          altitude: exec.mission.altitude,
          speed: exec.mission.speed
        }));
        setMissions(mappedMissions);
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  // No longer need client-side filtering since we fetch by status
  const filteredMissions = missions;

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'failed':
      case 'aborted': return 'destructive';
      case 'paused': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string | undefined | null) => {
    if (!status) return 'Unknown';
    if (status === 'pending') return 'Planned';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="mb-8">
           <Skeleton className="h-10 w-[180px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white/90">Mission Control</h2>
          <p className="mt-1 text-muted-foreground">Plan and execute drone surveys</p>
        </div>
        <Button asChild>
          <Link to="/missions/plan">
            <Plus className="mr-2 h-4 w-4" />
            New Mission
          </Link>
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Planned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Planned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="aborted">Aborted</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
      {filteredMissions.map((mission) => (
          <motion.div key={mission.executionId || mission.id} variants={item}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur-sm relative group">
              <Link 
                to={`/missions/${mission.id}/monitor${mission.executionId ? `?executionId=${mission.executionId}` : ''}`} 
                className="absolute inset-0 z-10" 
                aria-label={`View ${mission.name}`} 
              />
              <CardHeader className="pb-3 relative z-20 pointer-events-none">
                <div className="flex justify-between items-start mb-2">
                  {/* Hide Completed status badge in 'Planned' (all) view as requested */}
                  {!(filter === 'all' && mission.status === 'completed') && (
                    <Badge variant={getStatusColor(mission.status) as any}>
                      {getStatusLabel(mission.status)}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(mission.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{mission.name}</CardTitle>
                <CardDescription className="line-clamp-2">{mission.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 text-sm relative z-20 pointer-events-none">
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Map className="h-4 w-4 text-primary/70" />
                    <span>{mission.waypointCount} Waypoints</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mountain className="h-4 w-4 text-primary/70" />
                    <span>{mission.altitude}m Altitude</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4 text-primary/70" />
                    <span>{mission.patternType?.charAt(0).toUpperCase() + mission.patternType?.slice(1)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wind className="h-4 w-4 text-primary/70" />
                    <span>{mission.speed}m/s Speed</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 relative z-30">
                <Button className="w-full group/btn" asChild>
                  <Link to={`/missions/${mission.id}/monitor`}>
                    <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    View Mission
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
        
        {/* New Mission Card (always visible as the last item or if empty) */}
        <motion.div variants={item} className="h-full">
          <Link to="/missions/plan" className="block h-full">
            <div className="h-full rounded-xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white/90 mb-1">Create New Mission</h3>
              <p className="text-sm text-white/50 max-w-[200px]">Plan a new flight path and configure survey parameters</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
