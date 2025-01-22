import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Filter, Upload, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo, useRef } from "react";
import type { SelectFlag } from "@db/schema";

type SortOrder = "newest" | "oldest" | "text";
type ColorFilter = string[];

export default function FlagList() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [colorFilter, setColorFilter] = useState<ColorFilter>(["red", "yellow", "green"]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: flags = [], isLoading } = useQuery<SelectFlag[]>({
    queryKey: ["/api/documents/1/flags"],
    staleTime: 5000,
    refetchInterval: 5000,
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

  const clearAllFlags = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents/1/flags`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear flags");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/1/flags"] });
      toast({
        title: "Success",
        description: "All flags have been cleared",
      });
      setIsAlertOpen(false);
    },
  });

  const handleClearAll = () => {
    clearAllFlags.mutate();
  };

  const importFlags = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const res = await fetch("/api/documents/1/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });

      if (!res.ok) throw new Error("Failed to import flags");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/1/flags"] });
      toast({
        title: "Import Successful",
        description: "Flags have been imported successfully",
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import flags. Please check the CSV format.",
        variant: "destructive",
      });
    },
  });

  const sortedAndFilteredFlags = useMemo(() => {
    let filtered = flags.filter(flag => colorFilter.includes(flag.color));

    switch (sortOrder) {
      case "newest":
        return filtered.sort((a, b) => b.id - a.id);
      case "oldest":
        return filtered.sort((a, b) => a.id - b.id);
      case "text":
        return filtered.sort((a, b) => a.text.localeCompare(b.text));
      default:
        return filtered;
    }
  }, [flags, sortOrder, colorFilter]);

  const exportFlags = async (format: 'csv' | 'doc' | 'pdf') => {
    const response = await fetch(`/api/documents/1/export?format=${format}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flagged-text.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFlags.mutate(file);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Flagged Text</h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileInput}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={colorFilter.includes("red")}
                onCheckedChange={(checked) =>
                  setColorFilter(prev =>
                    checked ? [...prev, "red"] : prev.filter(c => c !== "red")
                  )
                }
              >
                Red Flags
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colorFilter.includes("yellow")}
                onCheckedChange={(checked) =>
                  setColorFilter(prev =>
                    checked ? [...prev, "yellow"] : prev.filter(c => c !== "yellow")
                  )
                }
              >
                Yellow Flags
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colorFilter.includes("green")}
                onCheckedChange={(checked) =>
                  setColorFilter(prev =>
                    checked ? [...prev, "green"] : prev.filter(c => c !== "green")
                  )
                }
              >
                Green Flags
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem onSelect={() => exportFlags('doc')}>
                Export as Word (.doc)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onSelect={() => exportFlags('csv')}>
                Export as CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onSelect={() => exportFlags('pdf')}>
                Export as PDF
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Flags</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all flags? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-4">
          {sortedAndFilteredFlags.map((flag) => (
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