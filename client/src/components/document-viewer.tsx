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

      // Calculate offsets in the original text content
      let currentOffset = 0;
      let startOffset = -1;
      let endOffset = -1;

      // Get all text nodes in the container
      const textNodes: Text[] = [];
      const treeWalker = window.document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Text | null;
      while ((node = treeWalker.nextNode() as Text)) {
        textNodes.push(node);
      }

      // Find the start and end offsets
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nodeLength = node.textContent?.length || 0;

        if (node === range.startContainer) {
          startOffset = currentOffset + range.startOffset;
        }
        if (node === range.endContainer) {
          endOffset = currentOffset + range.endOffset;
          break;
        }
        currentOffset += nodeLength;
      }

      if (startOffset === -1 || endOffset === -1) return;

      // Get the actual selected text from the full content
      const selectedText = fullText.substring(startOffset, endOffset).trim();
      const rangeText = range.toString().trim();

      // Only proceed if the texts match exactly
      if (selectedText === rangeText && selectedText.length > 0) {
        // Adjust offsets to match the trimmed text
        const finalStartOffset = fullText.indexOf(selectedText, startOffset);
        const finalEndOffset = finalStartOffset + selectedText.length;

        onTextSelect(selectedText, finalStartOffset, finalEndOffset);
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