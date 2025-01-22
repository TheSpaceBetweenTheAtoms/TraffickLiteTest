import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectDocument, SelectFlag } from "@db/schema";

interface DocumentViewerProps {
  onTextSelect: (text: string, start: number, end: number) => void;
}

export default function DocumentViewer({ onTextSelect }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: document, isLoading: documentLoading } = useQuery<SelectDocument>({
    queryKey: ["/api/documents/1"],
  });

  const { data: flags = [], isLoading: flagsLoading } = useQuery<SelectFlag[]>({
    queryKey: ["/api/documents/1/flags"],
  });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!range.toString().trim()) return;

      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      const start = range.startOffset;
      const end = range.endOffset;
      onTextSelect(range.toString(), start, end);
    };

    window.addEventListener("mouseup", handleSelection);
    return () => window.removeEventListener("mouseup", handleSelection);
  }, [onTextSelect]);

  const highlightContent = (content: string) => {
    // Sort flags by start offset in descending order
    const sortedFlags = [...flags].sort((a, b) => b.startOffset - a.startOffset);

    // Create highlighted spans
    sortedFlags.forEach(flag => {
      const prefix = content.substring(0, flag.startOffset);
      const highlighted = content.substring(flag.startOffset, flag.endOffset);
      const suffix = content.substring(flag.endOffset);

      content = `${prefix}<span style="background-color: ${flag.color}20; border-bottom: 2px solid ${flag.color}">${highlighted}</span>${suffix}`;
    });

    return content;
  };

  if (documentLoading || flagsLoading || !document) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[95%]" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: highlightContent(document.content) }}
    />
  );
}