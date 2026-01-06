import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Copy, Check, Monitor, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PackageType = 'rpm-amd64' | 'rpm-aarch64' | 'deb-amd64' | 'deb-aarch64';

const packageOptions = {
  'rpm-amd64': {
    name: 'RPM (x86_64)',
    command: (manager: string, agentName: string) => 
      `curl -o wazuh-agent-4.14.1-1.x86_64.rpm https://packages.wazuh.com/4.x/yum/wazuh-agent-4.14.1-1.x86_64.rpm && sudo WAZUH_MANAGER='${manager}' WAZUH_AGENT_NAME='${agentName}' rpm -ihv wazuh-agent-4.14.1-1.x86_64.rpm`
  },
  'rpm-aarch64': {
    name: 'RPM (aarch64)',
    command: (manager: string, agentName: string) => 
      `curl -o wazuh-agent-4.14.1-1.aarch64.rpm https://packages.wazuh.com/4.x/yum/wazuh-agent-4.14.1-1.aarch64.rpm && sudo WAZUH_MANAGER='${manager}' WAZUH_AGENT_NAME='${agentName}' rpm -ihv wazuh-agent-4.14.1-1.aarch64.rpm`
  },
  'deb-amd64': {
    name: 'DEB (amd64)',
    command: (manager: string, agentName: string) => 
      `wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.14.1-1_amd64.deb && sudo WAZUH_MANAGER='${manager}' WAZUH_AGENT_NAME='${agentName}' dpkg -i ./wazuh-agent_4.14.1-1_amd64.deb`
  },
  'deb-aarch64': {
    name: 'DEB (arm64)',
    command: (manager: string, agentName: string) => 
      `wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.14.1-1_arm64.deb && sudo WAZUH_MANAGER='${manager}' WAZUH_AGENT_NAME='${agentName}' dpkg -i ./wazuh-agent_4.14.1-1_arm64.deb`
  }
};

const startCommands = `sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent`;

export default function InstallAgent() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [wazuhManager] = useState('47.130.204.203');
  const { toast } = useToast();

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Command has been copied.",
    });
  };

  const installCommand = packageOptions['deb-amd64'].command(wazuhManager, agentName || 'wazuh-agent');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Install Wazuh Agent</h1>
          <p className="text-muted-foreground">
            Configure and install the Wazuh agent on your systems.
          </p>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Select your package type and configure the agent name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package">Package Type</Label>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-sm font-medium">DEB (amd64)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., web-server-01"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <div className="space-y-4">
          {/* Step 1: Install Agent */}
          <Card>
            <div className="absolute top-6 left-6 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              1
            </div>
            <CardHeader className="pl-20">
              <CardTitle>Install Wazuh Agent</CardTitle>
              <CardDescription>
                Run this command to download and install the Wazuh agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-20">
              <div className="relative group">
                <pre className="p-4 rounded-lg bg-secondary/50 border border-border font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">{installCommand}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(installCommand, 'install')}
                >
                  {copiedStep === 'install' ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Start Agent */}
          <Card>
            <div className="absolute top-6 left-6 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              2
            </div>
            <CardHeader className="pl-20">
              <CardTitle>Start Wazuh Agent</CardTitle>
              <CardDescription>
                Enable and start the Wazuh agent service.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-20">
              <div className="relative group">
                <pre className="p-4 rounded-lg bg-secondary/50 border border-border font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">{startCommands}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(startCommands, 'start')}
                >
                  {copiedStep === 'start' ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manager Info */}
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle>Wazuh Manager Configuration</CardTitle>
            <CardDescription>
              Your agents will connect to the Wazuh manager at this IP address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm">
                <strong>Manager IP:</strong> <code className="px-2 py-1 rounded bg-secondary">47.130.204.203</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Snort + Correlator Setup */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Snort + Correlator Setup</CardTitle>
            <CardDescription>
              For complete NIDS monitoring and event correlation, install Snort and the correlator agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-3">
              <p className="text-sm">
                <strong>Setup Instructions:</strong>
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Read the README file for complete setup details</li>
                <li>• For quick installation, go to the last section of the README</li>
              </ul>
              <a 
                href="https://github.com/SahiK19/agent-setup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Terminal className="w-4 h-4" />
                View Setup Instructions
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
