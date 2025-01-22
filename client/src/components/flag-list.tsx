import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SelectFlag } from "@db/schema";

export default function FlagList() {
  const { data: flags = [], isLoading } = useQuery<SelectFlag[]>({
    queryKey: ["/api/documents/1/flags"],
  });

  const deleteFlag = useMutation({
    mutationFn: async (flagId: number) => {
      const res = await fetch(`/api/flags/${flagId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete flag");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/1/flags"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Flagged Text</h2>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-4">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="p-3 rounded-lg border"
              style={{ borderColor: flag.color }}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm flex-1">{flag.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-500"
                  onClick={() => deleteFlag.mutate(flag.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}