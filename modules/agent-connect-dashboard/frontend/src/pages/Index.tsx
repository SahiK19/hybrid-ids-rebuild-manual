import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Activity,
  Lock,
  Zap,
  ChevronRight,
  Server,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const features = [
  {
    icon: Shield,
    title: "Network Intrusion Detection",
    description:
      "Real-time monitoring of network traffic to detect and alert on suspicious activities and potential threats.",
  },
  {
    icon: Server,
    title: "Host-based Detection",
    description:
      "Monitor system logs, file integrity, and process activities to identify compromised hosts.",
  },
  {
    icon: Activity,
    title: "Real-time Analytics",
    description:
      "Comprehensive dashboards with live statistics, threat distribution, and historical trends.",
  },
  {
    icon: Lock,
    title: "Secure API Integration",
    description:
      "Unique API tokens for each user ensure secure communication between agents and the platform.",
  },
];

export default function Index() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Hybrid IDS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Enterprise-grade security monitoring
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Protect Your Infrastructure with{" "}
              <span className="text-gradient">Intelligent Detection</span>
            </h1>

            <p
              className="text-lg text-muted-foreground mb-10 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Deploy our lightweight agents to monitor network traffic and host
              activities. Get real-time alerts and comprehensive analytics to
              stay ahead of threats.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Link to="/login">
                <Button variant="hero" size="xl">
                  Access Dashboard
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div
            className="mt-20 relative animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-xl p-2 shadow-2xl">
              <div className="rounded-lg bg-secondary/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Total Logs", value: "12,847", color: "primary" },
                    {
                      label: "Threats Blocked",
                      value: "234",
                      color: "destructive",
                    },
                    { label: "Agents Online", value: "8/8", color: "success" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold text-${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="h-32 rounded-lg border border-border bg-card flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">
                      Live monitoring dashboard preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Comprehensive Security Monitoring
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to detect, analyze, and respond to security
              threats in your infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary glow-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl border border-border bg-card p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Secure Your Infrastructure?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get started in minutes with our easy-to-deploy agents and
                intuitive dashboard.
              </p>
              <Link to="/login">
                <Button variant="hero" size="xl">
                  Access Dashboard
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">SecureWatch</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SecureWatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
