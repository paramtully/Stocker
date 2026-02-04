import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, UserPlus, Activity, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AdminMetrics {
  pageViews: {
    today: number;
    thisWeek: number;
    total: number;
  };
  visitors: {
    uniqueToday: number;
  };
  signups: {
    today: number;
    total: number;
  };
  users: {
    total: number;
  };
  recentActivity: Array<{
    path: string;
    occurredAt: string;
    sessionId: string;
  }>;
  hosting: {
    estimatedMonthlyCost: number;
    budgetLimit: number;
    status: string;
  };
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default" 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: typeof Eye;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    retry: false,
  });

  useEffect(() => {
    // If metrics query returns 401 or fails, user is not admin
    if (!authLoading && !metricsLoading) {
      const isUnauthorized = metricsError instanceof Error && metricsError.message.includes("401");
      if (isUnauthorized || (!metrics && metricsError)) {
        setLocation("/");
      }
    }
  }, [authLoading, metricsLoading, metricsError, metrics, setLocation]);

  if (authLoading || metricsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If we got an error (like 401), user is not admin
  if (metricsError) {
    return null;
  }
  
  // If no metrics and not loading, user is not admin
  if (!metricsLoading && !metrics) {
    return null;
  }

  const costPercentage = metrics 
    ? (metrics.hosting.estimatedMonthlyCost / metrics.hosting.budgetLimit) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Analytics and usage metrics</p>
        </div>
        <Badge variant={costPercentage < 80 ? "secondary" : "destructive"}>
          Budget: ${metrics?.hosting.estimatedMonthlyCost ?? 0} / ${metrics?.hosting.budgetLimit ?? 50}
        </Badge>
      </div>

      {metricsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Page Views Today"
              value={metrics.pageViews.today}
              subtitle={`${metrics.pageViews.thisWeek} this week`}
              icon={Eye}
            />
            <StatCard
              title="Unique Visitors Today"
              value={metrics.visitors.uniqueToday}
              subtitle={`${metrics.pageViews.total} total page views`}
              icon={Activity}
            />
            <StatCard
              title="Sign-ups Today"
              value={metrics.signups.today}
              subtitle={`${metrics.signups.total} total sign-ups`}
              icon={UserPlus}
            />
            <StatCard
              title="Total Users"
              value={metrics.users.total}
              subtitle="Registered + Guest accounts"
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Hosting Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Monthly Cost</span>
                    <span className="font-mono font-semibold">${metrics.hosting.estimatedMonthlyCost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Budget Limit</span>
                    <span className="font-mono">${metrics.hosting.budgetLimit}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        costPercentage < 80 ? "bg-green-500" : "bg-destructive"
                      }`}
                      style={{ width: `${Math.min(costPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {costPercentage < 80 
                      ? "Budget is healthy. Plenty of room for growth."
                      : "Warning: Approaching budget limit. Consider upgrading or optimizing."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {metrics.recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent activity</p>
                  ) : (
                    metrics.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                            {activity.path}
                          </code>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {new Date(activity.occurredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
