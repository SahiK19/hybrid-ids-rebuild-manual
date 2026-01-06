import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { StatsCard } from "./StatsCard";
import { Network, AlertTriangle, Shield, TrendingUp } from "lucide-react";

export function NidsAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://18.142.200.244:8080/api/analytics.php');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !analyticsData) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  const snortData = analyticsData.hourly_data?.filter((d: any) => d.source === 'snort') || [];
  const severityData = analyticsData.severity_distribution?.map((item: any, index: number) => ({
    name: item.severity,
    value: parseInt(item.count),
    color: ['hsl(187, 94%, 43%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(280, 85%, 55%)'][index % 4]
  })) || [];

  const totals = analyticsData.totals || {};
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={totals.total_logs?.toString() || "0"}
          change="+12.5%"
          changeType="positive"
          icon={Network}
        />
        <StatsCard
          title="Critical Alerts"
          value={totals.critical_alerts?.toString() || "0"}
          change="+5.2%"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="destructive"
        />
        <StatsCard
          title="Threats Blocked"
          value={totals.total_threats?.toString() || "0"}
          change="+18.3%"
          changeType="positive"
          icon={Shield}
          iconColor="success"
        />
        <StatsCard
          title="Correlated Events"
          value={totals.correlated_events?.toString() || "0"}
          change="-8.1%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Network Activity</h3>
            <p className="text-sm text-muted-foreground">Events over the last 24 hours</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snortData.map((d: any) => ({ time: d.hour, events: parseInt(d.count) }))}>
                <defs>
                  <linearGradient id="nidsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                <XAxis dataKey="time" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
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
                  dataKey="events"
                  stroke="hsl(187, 94%, 43%)"
                  fill="url(#nidsAreaGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Types Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Attack Types</h3>
            <p className="text-sm text-muted-foreground">Distribution by category</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {severityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {severityData.slice(0, 3).map((item: any) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Distribution */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Event Sources</h3>
          <p className="text-sm text-muted-foreground">Distribution by security source</p>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.source_distribution?.map((item: any) => ({ source: item.source, count: parseInt(item.count) })) || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" horizontal={false} />
              <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="source" type="category" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} axisLine={false} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 8%)",
                  border: "1px solid hsl(222, 47%, 16%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                }}
              />
              <Bar dataKey="count" fill="hsl(187, 94%, 43%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
