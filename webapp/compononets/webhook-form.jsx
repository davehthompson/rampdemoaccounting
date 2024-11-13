import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function WebhookForm({ onSubmit }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      await onSubmit(url);
      setUrl("");
      toast({
        title: "Webhook added",
        description: "Webhook has been successfully added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
      <div className="flex-1">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter webhook URL"
          required
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Webhook"}
      </Button>
    </form>
  );
}
