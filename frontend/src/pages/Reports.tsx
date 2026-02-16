import { useEffect, useState } from 'react';
import api from '@/services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  id: string;
  totalDistance: number;
  totalDuration: number;
  coverageArea: number;
  waypointsCompleted: number;
  maxSpeed?: number;
  maxAltitude?: number;
  batteryConsumed?: number;
  createdAt: string;
  execution: {
    status: string;
    mission: {
      name: string;
      patternType: string;
    };
    drone: {
      name: string;
    };
  };
}

interface Statistics {
  totalSurveys: number;
  totalDistance: number;
  totalDuration: number;
  avgDuration: number;
  totalCoverage: number;
  maxSpeedRecorded?: number;
  maxAltitudeRecorded?: number;
  totalBatteryConsumed?: number;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  const [filterPreset, setFilterPreset] = useState("7d");

  const handlePresetChange = (value: string) => {
    setFilterPreset(value);
    const end = new Date();
    if (value === '7d') {
      setStartDate(subDays(end, 7));
      setEndDate(end);
    }
    if (value === '30d') {
      setStartDate(subDays(end, 30));
      setEndDate(end);
    }
    if (value === 'all') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setFilterPreset('custom');
  };

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
      
      const res = await api.get('/reports', { params });
      setReports(res.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');

      const res = await api.get('/reports/statistics', { params });
      setStatistics(res.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const downloadCSV = () => {
    const headers = ['Mission Name', 'Drone', 'Date', 'Duration (min)', 'Distance (km)', 'Max Speed (m/s)', 'Max Alt (m)', 'Battery (%)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.execution.mission.name,
        report.execution.drone.name,
        new Date(report.createdAt).toLocaleDateString(),
        report.totalDuration,
        report.totalDistance.toFixed(2),
        (report.maxSpeed || 0).toFixed(1),
        (report.maxAltitude || 0).toFixed(1),
        report.batteryConsumed || 0,
        report.execution.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'survey_reports.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed':
      case 'aborted': return 'destructive';
      case 'in-progress': return 'warning';
      default: return 'secondary';
    }
  };

  // Prepare chart data
  const chartData = reports.slice(0, 10).map(report => ({
    name: new Date(report.createdAt).toLocaleDateString(),
    distance: parseFloat(report.totalDistance.toFixed(2)),
    duration: report.totalDuration,
    altitude: parseFloat((report.maxAltitude || 0).toFixed(2)),
    battery: report.batteryConsumed || 0
  })).reverse(); // Show oldest to newest



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

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-[380px] w-full" />
          <Skeleton className="h-[380px] w-full" />
        </div>

        {/* Table Skeleton */}
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white/90">Analytics & Reports</h2>
          <p className="mt-1 text-muted-foreground">Historical data and flight performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {[
            { label: 'Total Surveys', value: statistics.totalSurveys, colSpan: 1 },
            { label: 'Total Distance', value: `${statistics.totalDistance.toFixed(1)} km`, colSpan: 1 },
            { label: 'Total Duration', value: `${statistics.totalDuration} min`, colSpan: 1 },
            { label: 'Avg Duration', value: `${statistics.avgDuration} min`, colSpan: 1 },
            { label: 'Total Coverage', value: `${statistics.totalCoverage.toFixed(2)} km²`, colSpan: 1 },
            { label: 'Max Speed', value: `${statistics.maxSpeedRecorded || 0} m/s`, colSpan: 1 },
            { label: 'Max Altitude', value: `${statistics.maxAltitudeRecorded || 0} m`, colSpan: 1 },
            { label: 'Total Battery Consumed', value: `${statistics.totalBatteryConsumed || 0}%`, colSpan: 1 }
          ].map((stat, i) => (
            <Card key={i} className={`bg-card/50 backdrop-blur border-white/5 col-span-1`}>
              <CardContent className="p-4">
                <div className="text-[10px] text-muted-foreground uppercase font-medium truncate">{stat.label}</div>
                <div className="text-xl font-bold text-white/90 mt-1 truncate">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card/50 backdrop-blur border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-medium">Flight Performance (Distance & Altitude)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff66" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff66" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="altitude" stroke="#3b82f6" strokeWidth={2} dot={false} name="Max Alt (m)" />
                <Line type="monotone" dataKey="distance" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Distance (km)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-medium">Battery Consumption per Flight</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff66" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff66" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                <Bar dataKey="battery" fill="#ef4444" radius={[4, 4, 0, 0]} name="Battery Used (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-card/50 backdrop-blur border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mission Reports</CardTitle>
          <div className="flex items-center gap-4">
            {/* Presets */}
            <div className="flex gap-2 bg-background/50 p-1 rounded-md border border-input">
              <Button 
                variant={filterPreset === '7d' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => handlePresetChange('7d')}
                className="h-7 text-xs"
              >
                Last 7 Days
              </Button>
              <Button 
                variant={filterPreset === '30d' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => handlePresetChange('30d')}
                className="h-7 text-xs"
              >
                Last 30 Days
              </Button>
              <Button 
                variant={filterPreset === 'all' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => handlePresetChange('all')}
                className="h-7 text-xs"
              >
                All Time
              </Button>
            </div>
            
            {/* Date Picker */}
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                customInput={
                  <Button
                    id="date"
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal bg-background/50 border-input hover:bg-accent hover:text-accent-foreground",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      endDate ? (
                        <>
                          {format(startDate, "LLL dd, y")} -{" "}
                          {format(endDate, "LLL dd, y")}
                        </>
                      ) : (
                        format(startDate, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b [&_tr]:border-white/10">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mission</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Drone</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Distance</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Max Speed</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Max Alt</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Battery</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {report.execution.mission.name}
                      <span className="block text-xs text-muted-foreground font-normal">{report.execution.mission.patternType}</span>
                    </td>
                    <td className="p-4 align-middle">{report.execution.drone.name}</td>
                    <td className="p-4 align-middle">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">{report.totalDuration} min</td>
                    <td className="p-4 align-middle">{report.totalDistance.toFixed(2)} km</td>
                    <td className="p-4 align-middle">{report.maxSpeed ? report.maxSpeed.toFixed(1) : '-'} m/s</td>
                    <td className="p-4 align-middle">{report.maxAltitude ? report.maxAltitude.toFixed(1) : '-'} m</td>
                    <td className="p-4 align-middle">{report.batteryConsumed ? `${report.batteryConsumed}%` : '-'}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(report.execution.status) as any} className="capitalize">
                        {report.execution.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
