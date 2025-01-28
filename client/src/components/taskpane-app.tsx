import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flag } from "lucide-react";

interface DocumentFlag {
  color: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export default function TaskpaneApp() {
  const [selectedText, setSelectedText] = useState("");
  const { toast } = useToast();
  const [flags, setFlags] = useState<DocumentFlag[]>([]);

  const getSelectedText = useCallback(async () => {
    try {
      await Word.run(async (context: Word.RequestContext) => {
        const selection = context.document.getSelection();
        selection.load("text");
        await context.sync();
        setSelectedText(selection.text.trim());
      });
    } catch (error) {
      console.error("Failed to get selected text:", error);
      toast({
        title: "Error",
        description: "Failed to get selected text. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addFlag = useCallback(async (color: string) => {
    if (!selectedText) {
      toast({
        title: "No Text Selected",
        description: "Please select some text in the document first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Word.run(async (context: Word.RequestContext) => {
        const selection = context.document.getSelection();
        const range = selection.getRange();

        // Add highlighting
        range.font.highlightColor = color;

        // Get the range location for future reference
        range.load("start, end");
        await context.sync();

        const newFlag: DocumentFlag = {
          color,
          text: selectedText,
          startOffset: range.start,
          endOffset: range.end,
        };

        setFlags(prev => [...prev, newFlag]);
        setSelectedText("");

        toast({
          title: "Flag Added",
          description: `Text has been flagged with ${color}`,
        });
      });
    } catch (error) {
      console.error("Failed to add flag:", error);
      toast({
        title: "Error",
        description: "Failed to add flag. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedText, toast]);

  return (
    <div className="p-4 max-h-screen overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>Document Review</CardTitle>
          <CardDescription>
            Select text in your document and flag it for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={getSelectedText}
              className="w-full"
              variant="outline"
            >
              Get Selected Text
            </Button>

            {selectedText && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Text:</div>
                <div className="text-sm bg-muted p-2 rounded-md">
                  {selectedText}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addFlag("#ffeb3b")}
                    className="flex-1"
                    variant="outline"
                  >
                    <Flag className="mr-2 h-4 w-4 text-yellow-500" />
                    Yellow
                  </Button>
                  <Button
                    onClick={() => addFlag("#4caf50")}
                    className="flex-1"
                    variant="outline"
                  >
                    <Flag className="mr-2 h-4 w-4 text-green-500" />
                    Green
                  </Button>
                  <Button
                    onClick={() => addFlag("#ef5350")}
                    className="flex-1"
                    variant="outline"
                  >
                    <Flag className="mr-2 h-4 w-4 text-red-500" />
                    Red
                  </Button>
                </div>
              </div>
            )}

            {flags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Flags ({flags.length}):</div>
                <div className="space-y-2">
                  {flags.map((flag, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 rounded-md border"
                      style={{ backgroundColor: `${flag.color}10` }}
                    >
                      <div className="font-medium" style={{ color: flag.color }}>
                        Flag #{index + 1}
                      </div>
                      <div className="truncate">{flag.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}