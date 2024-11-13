import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function WebhooksList({ webhooks, onDelete }) {
  const handleDelete = async (url) => {
    try {
      await onDelete(url);
      toast({
        title: "Webhook removed",
        description: "Webhook has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove webhook",
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Webhook URL</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhooks.map((url) => (
          <TableRow key={url}>
            <TableCell>{url}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(url)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
