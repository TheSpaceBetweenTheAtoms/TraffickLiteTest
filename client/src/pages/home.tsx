import { useState } from "react";
import DocumentViewer from "@/components/document-viewer";
import FloatingToolbar from "@/components/floating-toolbar";
import FlagList from "@/components/flag-list";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [selectedText, setSelectedText] = useState("");
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  const handleTextSelect = (text: string, start: number, end: number) => {
    setSelectedText(text);
    setSelection({ start, end });
  };

  const clearSelection = () => {
    setSelectedText("");
    setSelection(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="p-4 relative min-h-[calc(100vh-2rem)]">
            <DocumentViewer onTextSelect={handleTextSelect} />
            {selectedText && (
              <FloatingToolbar
                selectedText={selectedText}
                selection={selection!}
                onClose={clearSelection}
              />
            )}
          </Card>
        </div>
        <div className="lg:col-span-1">
          <FlagList />
        </div>
      </div>
    </div>
  );
}
