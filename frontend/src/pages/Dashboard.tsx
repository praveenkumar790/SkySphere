import { useEffect, useState } from 'react';
import api from '@/services/api';
import DroneCard from '@/components/dashboard/DroneCard';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plane, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  currentLat?: number;
  currentLng?: number;
  lastSeen?: string;
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

export default function Dashboard() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // New State for Add Drone Modal
  const [isAddDroneOpen, setIsAddDroneOpen] = useState(false);
  const [newDroneName, setNewDroneName] = useState('');
  const [newDroneModel, setNewDroneModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDrones();
  }, []);

  const fetchDrones = async () => {
    try {
      const res = await api.get('/drones');
      setDrones(res.data);
    } catch (error) {
      console.error('Failed to fetch drones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDroneName || !newDroneModel) return;

    try {
      setIsSubmitting(true);
      await api.post('/drones', {
        name: newDroneName,
        model: newDroneModel,
        batteryLevel: 100,
        currentLat: 28.6139, // Default to New Delhi coordinates
        currentLng: 77.2090
      });
      
      // Reset and refresh
      setNewDroneName('');
      setNewDroneModel('');
      setIsAddDroneOpen(false);
      fetchDrones();
    } catch (error) {
      console.error('Failed to add drone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrones = drones.filter((drone) => {
    const matchesFilter = filter === 'all' || drone.status === filter;
    const matchesSearch = drone.name.toLowerCase().includes(search.toLowerCase()) ||
                         drone.model.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center text-left"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white/90">Fleet Dashboard</h2>
          <p className="mt-1 text-muted-foreground">Manage and monitor your drone fleet</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isAddDroneOpen} onOpenChange={setIsAddDroneOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                <Plus className="h-4 w-4" />
                Add Drone
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Drone</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDrone} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newDroneName}
                    onChange={(e) => setNewDroneName(e.target.value)}
                    placeholder="e.g. Sentinel-01"
                    className="col-span-3 bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={newDroneModel}
                    onChange={(e) => setNewDroneModel(e.target.value)}
                    placeholder="e.g. DJI Matrice 300"
                    className="col-span-3 bg-white/5 border-white/10"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-500">
                    {isSubmitting ? 'Adding...' : 'Add Fleet Member'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button asChild>
            <Link to="/missions">
              View Missions
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search drones..."
            className="pl-9 bg-white/5 border-white/10 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 text-white">
              <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white">
              <SelectItem value="all">All Drones</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in-mission">In Mission</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white/70">Loading drones...</div>
      ) : filteredDrones.length === 0 ? (
        <div className="text-center text-white/70">No drones found matching your criteria.</div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredDrones.map((drone) => (
            <motion.div key={drone.id} variants={item}>
              <DroneCard drone={drone} onUpdate={fetchDrones} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
