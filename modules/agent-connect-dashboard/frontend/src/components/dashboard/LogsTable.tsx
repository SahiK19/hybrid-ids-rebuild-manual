import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useState } from "react";

interface Log {
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

interface LogsTableProps {
  logs: Log[];
}

const severityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground",
};

export function LogsTable({ logs }: LogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const parseRawJson = (log: Log) => {
    try {
      const rawData = typeof log.raw_json === 'string' ? JSON.parse(log.raw_json) : log.raw_json;
      return {
        correlation_type: rawData?.correlation_type || 'N/A',
        stage1: rawData?.stage1 || {},
        stage2: rawData?.stage2 || {},
        src_ip: rawData?.src_ip || 'N/A',
        agent_id: rawData?.agent_id || log.agent_id || 'N/A',
        time_difference: rawData?.time_difference_seconds ? `${rawData.time_difference_seconds}s` : rawData?.time_difference || 'N/A'
      };
    } catch {
      return {
        correlation_type: 'N/A',
        stage1: {},
        stage2: {},
        src_ip: 'N/A',
        agent_id: log.agent_id || 'N/A',
        time_difference: 'N/A'
      };
    }
  };
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Agent ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Correlated
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-secondary/20 transition-colors duration-150"
              >
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                  {log.id}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                  {(() => {
                    try {
                      let dateStr = log.timestamp || log.created_at;
                      if (!dateStr) return '—';
                      
                      // Normalize timestamp format for correlation logs
                      if (typeof dateStr === 'string' && dateStr.includes(' UTC')) {
                        dateStr = dateStr.replace(' ', 'T').replace(' UTC', 'Z');
                      }
                      
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? '—' : date.toISOString().replace('T', ' ').replace('Z', ' GMT');
                    } catch {
                      return '—';
                    }
                  })()}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-foreground whitespace-nowrap">
                  <Badge variant="outline" className="capitalize">
                    {log.source}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                  <span className="font-mono">{log.agent_id || "-"}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", 
                      log.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                      log.severity === 'high' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                      log.severity === 'medium' ? 'bg-warning/20 text-warning border-warning/30' :
                      'bg-muted text-muted-foreground'
                    )}
                  >
                    {log.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={log.correlated ? "default" : "secondary"}>
                    {log.correlated ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">
                  {(() => {
                    let message = log.message;
                    
                    // Extract message from raw_json if message is empty
                    if (!message && log.raw_json) {
                      try {
                        const rawData = typeof log.raw_json === 'string' ? JSON.parse(log.raw_json) : log.raw_json;
                        
                        // Priority order: message > correlation_type > constructed message from stages
                        if (rawData.message) {
                          message = rawData.message;
                        } else if (rawData.correlation_type) {
                          message = rawData.correlation_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                        } else if (rawData.stage1 && rawData.stage2) {
                          message = `${rawData.stage1.type || 'Event'} → ${rawData.stage2.type || 'Event'}`;
                        }
                      } catch (e) {
                        console.error('Error parsing raw_json:', e);
                      }
                    }
                    
                    // Final fallback
                    if (!message) {
                      const agentId = log.agent_id || 'unknown';
                      message = `Correlated security event detected on ${agentId}`;
                    }
                    
                    return message;
                  })()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Correlated Event Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {(() => {
                          const details = parseRawJson(log);
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Correlation Type</label>
                                <p className="text-sm font-mono">{details.correlation_type}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Source IP</label>
                                <p className="text-sm font-mono">{details.src_ip}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Agent ID</label>
                                <p className="text-sm font-mono">{details.agent_id}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Time Difference</label>
                                <p className="text-sm font-mono">{details.time_difference}</p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Stage 1 Event</label>
                                <p className="text-sm font-mono bg-muted p-2 rounded">
                                  {details.stage1?.wazuh_alert || 'No stage 1 data'}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Stage 2 Event</label>
                                <p className="text-sm font-mono bg-muted p-2 rounded">
                                  {details.stage2?.wazuh_alert || 'No stage 2 data'}
                                </p>
                              </div>
                            </div>
                          );
                        })()
                        }
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
