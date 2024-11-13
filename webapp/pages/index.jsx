import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { WebhookForm } from "@/components/webhook-form";
import { WebhooksList } from "@/components/webhooks-list";
import { MonitorControls } from "@/components/monitor-controls";
import { Toaster } from "@/components/ui/toaster";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
    }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, webhooksRes] = await Promise.all([
        api.get('/api/monitor/status'),
        api.get('/api/webhooks')
      ]);

      setMetrics(metricsRes.data.metrics);
      setIsRunning(metricsRes.data.metrics.isRunning);
      setWebhooks(webhooksRes.data.webhooks);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);




}
  };

  const handleStartMonitor = async () => {
    await api.post('/api/monitor/start');
    setIsRunning(true);
  };

  const handleStopMonitor = async () => {
    await api.post('/api/monitor/stop');
    setIsRunning(false);
  };

  const handleAddWebhook = async (url) => {
    await api.post('/api/webhooks', { url });
    await fetchData();
  };

  const handleDeleteWebhook = async (url) => {
    await api.delete('/api/webhooks', { data: { url } });
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container py-8">
        <div className="grid gap-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Database Monitor Dashboard</h1>
            <MonitorControls
              isRunning={isRunning}
              onStart={handleStartMonitor}
              onStop={handleStopMonitor}
            />
          </div>

          {/* Metrics */}
          <DashboardMetrics metrics={metrics} />

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <WebhookForm onSubmit={handleAddWebhook} />
              {webhooks.length > 0 ? (
                <WebhooksList
                  webhooks={webhooks}
                  onDelete={handleDeleteWebhook}
                />
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No webhooks configured
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
Last edited 8 minutes ago


