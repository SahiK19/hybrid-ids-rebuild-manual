import { useState, useEffect } from 'react';

interface CorrelatedEvent {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  severity: string;
  raw_json: any;
  created_at: string;
  agent_id?: string | null;
}

interface CorrelatedEventsData {
  correlatedLogs: CorrelatedEvent[];
  isLoading: boolean;
  error: string | null;
}

export function useCorrelatedEvents(): CorrelatedEventsData {
  const [data, setData] = useState<CorrelatedEventsData>({
    correlatedLogs: [],
    isLoading: false,
    error: null
  });

  useEffect(() => {
    const fetchCorrelatedEvents = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch(`http://18.142.200.244:5000/api/correlated-logs?_t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const correlatedLogs = Array.isArray(result) ? result : [];
        
        setData({
          correlatedLogs,
          isLoading: false,
          error: null
        });
        
      } catch (error) {
        console.error('Failed to fetch correlated events:', error);
        setData(prev => ({
          ...prev,
          correlatedLogs: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch correlated events'
        }));
      }
    };

    fetchCorrelatedEvents();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchCorrelatedEvents, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return data;
}