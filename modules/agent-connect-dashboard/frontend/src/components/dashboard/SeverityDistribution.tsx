import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface SeverityData {
  label: string;
  count: number;
  percentage: number;
}

interface SeverityDistributionProps {
  displayedRows: any[];
}

const SeverityDistribution = ({ displayedRows }: SeverityDistributionProps) => {
  const [data, setData] = useState<SeverityData[]>([]);

  const colorMap = {
    Critical: '#ef4444', // red-500
    High: '#f97316',     // orange-500
    Medium: '#eab308',   // yellow-500
    Low: '#22c55e'       // green-500
  };

  // Calculate severity distribution from displayed table rows
  const calculateSeverityDistribution = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      return [];
    }

    // Count severity occurrences from displayed rows
    const severityCounts: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const severity = row.severity?.toLowerCase();
      if (severity) {
        const capitalizedSeverity = severity.charAt(0).toUpperCase() + severity.slice(1);
        severityCounts[capitalizedSeverity] = (severityCounts[capitalizedSeverity] || 0) + 1;
      }
    });

    const total = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);
    
    // Convert to chart data format
    return Object.entries(severityCounts).map(([severity, count]) => ({
      label: severity,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  // Recalculate whenever displayedRows changes
  useEffect(() => {
    const newData = calculateSeverityDistribution(displayedRows);
    setData(newData);
  }, [displayedRows]);

  const chartConfig = {
    Critical: { label: "Critical", color: colorMap.Critical },
    High: { label: "High", color: colorMap.High },
    Medium: { label: "Medium", color: colorMap.Medium },
    Low: { label: "Low", color: colorMap.Low }
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => {
        const severityData = data.find(d => d.label === entry.value);
        return (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.value} ({severityData?.percentage.toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Severity Distribution
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Security alerts by severity level
        </p>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Severity Distribution
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Security alerts by severity level
      </p>
      
      <ChartContainer config={chartConfig} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="percentage"
              nameKey="label"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colorMap[entry.label as keyof typeof colorMap]} 
                />
              ))}
            </Pie>
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {data.label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Count: {data.count}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Percentage: {data.percentage.toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default SeverityDistribution;