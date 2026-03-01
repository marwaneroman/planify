import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchOrganization, fetchAnalytics } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(225, 70%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(0, 72%, 51%)",
];

const Analytics = () => {
  const { orgId } = useParams<{ orgId: string }>();

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => fetchOrganization(orgId!),
    enabled: !!orgId,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", orgId],
    queryFn: () => fetchAnalytics(orgId!),
    enabled: !!orgId,
  });

  return (
    <AppLayout
      orgId={orgId}
      orgName={org?.name}
      breadcrumbs={[
        { label: "Organizations", href: "/" },
        { label: org?.name || "...", href: `/org/${orgId}` },
        { label: "Analytics" },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Task and project statistics</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{analytics?.totalTasks || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{analytics?.completionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.byStatus && analytics.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.byStatus}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(225, 70%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.byPriority && analytics.byPriority.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.byPriority}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {analytics.byPriority.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Analytics;
