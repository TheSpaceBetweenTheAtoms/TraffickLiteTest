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
    staleTime: 0,
    refetchInterval: 1000,
  });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!range.toString().trim()) return;

      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      // Get pure text content (without HTML)
      const content = container.innerText;
      const selectionText = range.toString();

      // Calculate offsets using text content
      let startOffset = 0;
      const textWalker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Text | null = textWalker.nextNode() as Text;
      while (node) {
        if (node === range.startContainer) {
          startOffset += range.startOffset;
          break;
        }
        startOffset += node.textContent?.length || 0;
        node = textWalker.nextNode() as Text;
      }

      const endOffset = startOffset + selectionText.length;
      onTextSelect(selectionText, startOffset, endOffset);
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [onTextSelect]);

  const processContent = (content: string) => {
    // Sort flags by start offset in ascending order
    const sortedFlags = [...flags].sort((a, b) => a.startOffset - b.startOffset);

    let result = content;
    let offset = 0;

    // Apply highlights one by one
    sortedFlags.forEach(flag => {
      const start = flag.startOffset + offset;
      const end = flag.endOffset + offset;
      const before = result.substring(0, start);
      const highlighted = result.substring(start, end);
      const after = result.substring(end);

      // Use semi-transparent background color for better visibility
      const highlightedSpan = `<span style="background-color: ${flag.color}20; border-bottom: 2px solid ${flag.color}; padding: 0 1px;">${highlighted}</span>`;
      result = before + highlightedSpan + after;
      offset += highlightedSpan.length - highlighted.length;
    });

    return result;
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
      dangerouslySetInnerHTML={{ __html: processContent(document.content) }}
    />
  );
}