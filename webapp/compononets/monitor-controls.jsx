import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function MonitorControls({ isRunning, onStart, onStop }) {
  const handleToggle = async () => {
    try {
      if (isRunning) {
        await onStop();
        toast({
          title: "Monitor stopped",
          description: "Database monitor has been stopped",
        });
      } else {
        await onStart();
        toast({
          title: "Monitor started",
          description: "Database monitor is now running",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isRunning ? "stop" : "start"} monitor`,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isRunning ? "destructive" : "default"}
    >
      {isRunning ? "Stop Monitor" : "Start Monitor"}
    </Button>
  );
}
