import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingToolbarProps {
  selectedText: string;
  selection: { start: number; end: number };
  onClose: () => void;
}

export default function FloatingToolbar({
  selectedText,
  selection,
  onClose,
}: FloatingToolbarProps) {
  const createFlag = useMutation({
    mutationFn: async ({ color }: { color: string }) => {
      const res = await fetch("/api/documents/1/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
          color,
          startOffset: selection.start,
          endOffset: selection.end,
        }),
      });
      if (!res.ok) throw new Error("Failed to create flag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/1/flags"] });
      onClose();
    },
  });

  const handleFlag = (color: string) => {
    createFlag.mutate({ color });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-50 bg-white rounded-lg shadow-lg p-2 flex gap-2"
      style={{
        left: `${selection.start}px`,
        top: `${selection.end + 24}px`,
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => handleFlag("red")}
      >
        <AlertCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
        onClick={() => handleFlag("yellow")}
      >
        <AlertTriangle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-green-500 hover:text-green-600 hover:bg-green-50"
        onClick={() => handleFlag("green")}
      >
        <CheckCircle2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
