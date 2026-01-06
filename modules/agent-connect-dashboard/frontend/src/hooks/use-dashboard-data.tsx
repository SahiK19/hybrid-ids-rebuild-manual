import { useState, useEffect } from 'react';

interface DashboardStats {
  totalLogs: number;
  threatsBlocked: number;
  criticalAlerts: number;
  activeAgents: string;
  logsChange: string;
  threatsChange: string;
  alertsChange: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  severity: string;
  raw_json: any;
  created_at: string;
  correlated: boolean;
  agent_id?: string | null;
}

interface DashboardData {
  stats: DashboardStats;
  recentLogs: LogEntry[];
  isLoading: boolean;
  error: string | null;
  isAgentConnected: boolean;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalLogs: 12847,
      threatsBlocked: 234,
      criticalAlerts: 8,
      activeAgents: '3/3',
      logsChange: '+12% from yesterday',
      threatsChange: '234 blocked today',
      alertsChange: '+3 new alerts'
    },
    recentLogs: [],
    isLoading: false,
    error: null,
    isAgentConnected: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch(`http://18.142.200.244:5000/api/logs?_t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dashboard API response:', result); // Debug log
        
        // Process logs data
        const allLogs = result || [];
        console.log('Processed logs:', allLogs); // Debug log
        
        if (allLogs.length > 0) {
          // Use real data if available
          const totalLogs = allLogs.length || 0;
          const criticalAlerts = allLogs.filter(log => log.severity === 'critical').length;
          const highAlerts = allLogs.filter(log => log.severity === 'high').length;
          const threatsBlocked = allLogs.length;
          
          const recentLogs = allLogs.slice(0, 10);

          console.log('Setting real logs data:', recentLogs); // Debug log
          setData(prev => ({
            ...prev,
            stats: {
              totalLogs,
              threatsBlocked,
              criticalAlerts,
              activeAgents: '3/3',
              logsChange: '+12% from yesterday',
              threatsChange: `${threatsBlocked} blocked today`,
              alertsChange: `+${criticalAlerts} new alerts`
            },
            recentLogs,
            isLoading: false,
            error: null,
            isAgentConnected: true
          }));
        } else {
          console.log('No logs data, setting empty array'); // Debug log
          setData(prev => ({ 
            ...prev, 
            recentLogs: [],
            isLoading: false 
          }));
        }
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set empty logs on error
        setData(prev => ({ 
          ...prev, 
          recentLogs: [],
          isLoading: false, 
          error: null 
        }));
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return data;
}