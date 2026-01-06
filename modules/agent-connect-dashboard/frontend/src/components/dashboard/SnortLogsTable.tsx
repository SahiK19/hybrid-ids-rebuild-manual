import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SnortLog {
  id: number;
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  source_port: number | null;
  dest_port: number | null;
  protocol: string | null;
  signature: string;
  severity: string;
  event_type: string;
  raw_data: any;
  created_at: string;
}

interface SnortLogsTableProps {
  logs: SnortLog[];
}

const severityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground",
};

export function SnortLogsTable({ logs }: SnortLogsTableProps) {
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
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Correlated
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Message
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log, index) => (
              <tr
                key={log.id}
                className="hover:bg-secondary/20 transition-colors duration-150"
              >
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-foreground whitespace-nowrap">
                  <Badge variant="outline" className="capitalize">
                    Snort
                  </Badge>
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
                  <Badge variant="secondary">
                    No
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">
                  {log.signature}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}