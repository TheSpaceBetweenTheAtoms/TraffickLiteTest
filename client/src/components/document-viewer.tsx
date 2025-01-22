import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SelectDocument, SelectFlag } from "@db/schema";

interface DocumentViewerProps {
  onTextSelect: (text: string, start: number, end: number) => void;
}

export default function DocumentViewer({ onTextSelect }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Get the full document content as plain text
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = document.content;
      const fullText = tempDiv.textContent || '';

      // Get selected text and normalize whitespace
      const selectedText = range.toString().trim();
      if (!selectedText) return;

      // Calculate offsets by walking through text nodes
      let currentOffset = 0;
      let startOffset = -1;
      const treeWalker = window.document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node = treeWalker.nextNode();
      while (node) {
        const nodeText = node.textContent || '';

        if (node === range.startContainer) {
          startOffset = currentOffset + range.startOffset;
          // Find the actual text start by skipping whitespace
          while (startOffset < currentOffset + nodeText.length && 
                 /\s/.test(fullText[startOffset])) {
            startOffset++;
          }
          break;
        }

        currentOffset += nodeText.length;
        node = treeWalker.nextNode();
      }

      if (startOffset === -1) return;

      const endOffset = startOffset + selectedText.length;

      // Verify the selection
      const extractedText = fullText.substring(startOffset, endOffset).trim();
      if (extractedText === selectedText) {
        onTextSelect(selectedText, startOffset, endOffset);
      }
    };

    window.document.addEventListener("mouseup", handleSelection);
    return () => window.document.removeEventListener("mouseup", handleSelection);
  }, [document?.content, onTextSelect]);

  const processContent = (content: string) => {
    if (!content) return '';

    // Sort flags by start offset in descending order to avoid offset issues
    const sortedFlags = [...flags].sort((a, b) => b.startOffset - a.startOffset);

    let result = content;
    sortedFlags.forEach(flag => {
      const before = result.substring(0, flag.startOffset);
      const highlighted = result.substring(flag.startOffset, flag.endOffset);
      const after = result.substring(flag.endOffset);

      const highlightedSpan = `<span class="relative inline-block" style="
        background-color: ${flag.color}20;
        box-shadow: inset 0 -2px 0 ${flag.color};
        padding: 1px 2px;
        margin: -1px -2px;
        border-radius: 2px;
      ">${highlighted}</span>`;

      result = before + highlightedSpan + after;
    });

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