import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SelectDocument, SelectFlag } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  onTextSelect: (text: string, start: number, end: number) => void;
}

export default function DocumentViewer({ onTextSelect }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: document, isLoading: documentLoading, error: documentError } = useQuery<SelectDocument>({
    queryKey: ["/api/documents/1"],
    retry: 1,
  });

  const { data: flags = [], isLoading: flagsLoading, error: flagsError } = useQuery<SelectFlag[]>({
    queryKey: ["/api/documents/1/flags"],
    staleTime: 5000,
    refetchInterval: 5000,
    retry: 1,
  });

  useEffect(() => {
    if (!document?.content) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!range.toString().trim()) return;

      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      // Get the normalized text content
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = document.content;
      const fullText = tempDiv.textContent || '';

      // Get the exact selected text
      const selectedText = range.toString().trim();
      if (!selectedText) return;

      // Walk through text nodes to find exact position
      let currentPos = 0;
      let startOffset = -1;
      const walker = window.document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      let startNode = false;
      while ((node = walker.nextNode() as Text)) {
        const nodeText = node.textContent || '';

        if (node === range.startContainer) {
          startNode = true;
          startOffset = currentPos + range.startOffset;

          // Get the actual text at this position
          const textAtPos = fullText.substring(startOffset).trim();
          if (textAtPos.startsWith(selectedText)) {
            // Found exact match
            const endOffset = startOffset + selectedText.length;
            onTextSelect(selectedText, startOffset, endOffset);
            return;
          }
        }

        if (!startNode) {
          currentPos += nodeText.length;
        }
      }

      // If exact match not found, try fuzzy matching as fallback
      const fuzzyIndex = fullText.indexOf(selectedText);
      if (fuzzyIndex !== -1) {
        onTextSelect(selectedText, fuzzyIndex, fuzzyIndex + selectedText.length);
      }
    };

    window.document.addEventListener("mouseup", handleSelection);
    return () => window.document.removeEventListener("mouseup", handleSelection);
  }, [document?.content, onTextSelect]);

  const escapeHtml = (str: string) => {
    const div = window.document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const processContent = (content: string) => {
    if (!content) return '';

    // Create segments for highlighting
    type Segment = { start: number; end: number; color: string };
    const segments: Segment[] = [];

    // Sort flags by start offset for consistent rendering
    const sortedFlags = [...flags].sort((a, b) => a.startOffset - b.startOffset);

    // Create non-overlapping segments
    for (const flag of sortedFlags) {
      segments.push({
        start: flag.startOffset,
        end: flag.endOffset,
        color: flag.color
      });
    }

    // Build the HTML with highlights
    let result = '';
    let currentPos = 0;

    for (const segment of segments) {
      // Add text before highlight
      const beforeText = content.substring(currentPos, segment.start);
      result += escapeHtml(beforeText);

      // Add highlighted text
      const highlightedText = content.substring(segment.start, segment.end);
      const escapedHighlightedText = escapeHtml(highlightedText);

      result += `<mark class="relative inline-block" style="
        background-color: ${segment.color}20;
        box-shadow: inset 0 -2px 0 ${segment.color};
        padding: 2px;
        margin: -2px;
        border-radius: 2px;
      ">${escapedHighlightedText}</mark>`;

      currentPos = segment.end;
    }

    // Add remaining text
    result += escapeHtml(content.substring(currentPos));

    return result;
  };

  if (documentError || flagsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {documentError ? "Failed to load document. Please try refreshing the page." : 
           flagsError ? "Failed to load flags. Some highlights may be missing." : 
           "An unexpected error occurred."}
        </AlertDescription>
      </Alert>
    );
  }

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
      className="prose prose-sm max-w-none relative selection:bg-blue-200"
      dangerouslySetInnerHTML={{ __html: processContent(document.content) }}
    />
  );
}