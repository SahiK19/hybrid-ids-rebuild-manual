import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from 'react';

interface ActivityData {
  time: string;
  nids: number;
  hids: number;
  correlated: number;
}

interface ApiResponse {
  snort: Array<{ hour: number; count: number }>;
  wazuh: Array<{ hour: number; count: number }>;
  correlated: Array<{ hour: number; count: number }>;
}

export function ActivityChart() {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('http://18.142.200.244:5000/api/activity-overview');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const apiData: ApiResponse = await response.json();
      
      const normalizedData: ActivityData[] = [];
      for (let hour = 0; hour < 24; hour += 4) {
        const snortEntry = apiData.snort.find(item => item.hour === hour);
        const wazuhEntry = apiData.wazuh.find(item => item.hour === hour);
        const correlatedEntry = apiData.correlated.find(item => item.hour === hour);
        
        normalizedData.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          nids: snortEntry?.count || 0,
          hids: wazuhEntry?.count || 0,
          correlated: correlatedEntry?.count || 0
        });
      }
      
      setData(normalizedData);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
          <p className="text-sm text-muted-foreground">Loading activity data...</p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
        <p className="text-sm text-muted-foreground">Log activity over the last 24 hours</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="nidsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hidsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="correlatedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(280, 85%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(280, 85%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
            <XAxis
              dataKey="time"
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 8%)",
                border: "1px solid hsl(222, 47%, 16%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="nids"
              stroke="hsl(187, 94%, 43%)"
              fill="url(#nidsGradient)"
              strokeWidth={2}
              name="NIDS"
            />
            <Area
              type="monotone"
              dataKey="hids"
              stroke="hsl(142, 76%, 36%)"
              fill="url(#hidsGradient)"
              strokeWidth={2}
              name="HIDS"
            />
            <Area
              type="monotone"
              dataKey="correlated"
              stroke="hsl(280, 85%, 55%)"
              fill="url(#correlatedGradient)"
              strokeWidth={2}
              name="Correlated"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">NIDS Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">HIDS Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(280, 85%, 55%)" }} />
          <span className="text-sm text-muted-foreground">Correlated</span>
        </div>
      </div>
    </div>
  );
}
