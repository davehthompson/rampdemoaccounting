import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DashboardMetrics({ metrics }) {
  const {
    totalChangesDetected,
    totalChangesSent,
    failedApiCalls,
    successfulApiCalls,
    averageProcessingTime,
    processedBatches,
    status,
  } = metrics || {};

  const stats = [
    {
      title: "Total Changes",
      value: totalChangesDetected || 0,
      description: "Changes detected",
    },
    {
      title: "Changes Sent",
      value: totalChangesSent || 0,
      description: "Successfully delivered",
    },
    {
      title: "Success Rate",
      value: successfulApiCalls ? 
        `${((successfulApiCalls / (successfulApiCalls + failedApiCalls)) * 100).toFixed(1)}%` : 
        "N/A",
      description: "API calls success rate",
    },
    {
      title: "Processing Time",
      value: `${(averageProcessingTime || 0).toFixed(2)}ms`,
      description: "Average processing time",
    },
  ];

  // Sample data for the chart - in production, this would come from your API
  const chartData = [
    { name: "00:00", changes: 40 },
    { name: "04:00", changes: 30 },
    { name: "08:00", changes: 60 },
    { name: "12:00", changes: 50 },
    { name: "16:00", changes: 75 },
    { name: "20:00", changes: 45 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
      
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Changes Over Time</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="changes" 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
