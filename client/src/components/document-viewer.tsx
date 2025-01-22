import { useEffect, useRef, useState } from "react";
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
  const contentRef = useRef<string>("");
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

  // Update content reference when document changes
  useEffect(() => {
    if (document?.content) {
      contentRef.current = document.content;
    }
  }, [document?.content]);

  useEffect(() => {
    if (!containerRef.current || !document?.content) return;

    const container = containerRef.current;

    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      const selectedText = range.toString().trim();
      if (!selectedText) return;

      // Get text content without HTML tags
      const textContent = container.textContent || '';

      // Calculate the actual offset by traversing text nodes
      let currentOffset = 0;
      let foundStart = false;
      let startOffset = 0;

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode() as Text)) {
        if (node === range.startContainer) {
          startOffset = currentOffset + range.startOffset;
          foundStart = true;
          break;
        }
        currentOffset += node.textContent?.length || 0;
      }

      if (foundStart) {
        // Verify text and check for overlaps
        const textAtPosition = textContent.substring(startOffset, startOffset + selectedText.length);

        if (textAtPosition === selectedText) {
          // Check for overlapping flags
          const hasOverlap = flags.some(flag => 
            (startOffset < flag.endOffset && startOffset + selectedText.length > flag.startOffset)
          );

          if (hasOverlap) {
            toast({
              title: "Selection Error",
              description: "Selected text overlaps with existing highlights",
              variant: "destructive",
            });
            return;
          }

          onTextSelect(selectedText, startOffset, startOffset + selectedText.length);
        }
      }
    };

    container.addEventListener('mouseup', handleSelection);
    return () => container.removeEventListener('mouseup', handleSelection);
  }, [document?.content, flags, onTextSelect, toast]);

  const renderContent = () => {
    if (!document?.content) return '';

    let html = document.content;
    const sortedFlags = [...flags].sort((a, b) => b.startOffset - a.startOffset);

    // Create a temporary container to work with the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;

    // Apply highlights from end to start
    for (const flag of sortedFlags) {
      const walker = document.createTreeWalker(
        tempContainer,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let startNode = null;
      let startOffset = 0;
      let endNode = null;
      let endOffset = 0;
      let node;

      // Find the nodes containing our highlight boundaries
      while ((node = walker.nextNode() as Text)) {
        const nodeLength = node.length;
        const nodeEndPos = currentPos + nodeLength;

        if (!startNode && flag.startOffset >= currentPos && flag.startOffset < nodeEndPos) {
          startNode = node;
          startOffset = flag.startOffset - currentPos;
        }

        if (!endNode && flag.endOffset > currentPos && flag.endOffset <= nodeEndPos) {
          endNode = node;
          endOffset = flag.endOffset - currentPos;
          break;
        }

        currentPos += nodeLength;
      }

      // Apply the highlight if we found both boundaries
      if (startNode && endNode) {
        try {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          const highlightEl = document.createElement('mark');
          highlightEl.style.backgroundColor = `${flag.color}20`;
          highlightEl.style.boxShadow = `inset 0 -2px 0 ${flag.color}`;
          highlightEl.style.borderRadius = '2px';
          highlightEl.style.padding = '2px';
          highlightEl.style.margin = '-2px';
          highlightEl.style.display = 'inline-block';
          highlightEl.className = 'highlight-mark';

          // Only wrap if the range is valid
          if (range.toString().trim() === flag.text) {
            range.surroundContents(highlightEl);
          }
        } catch (error) {
          console.error('Failed to apply highlight:', error);
        }
      }
    }

    return tempContainer.innerHTML;
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
      dangerouslySetInnerHTML={{ __html: renderContent() }}
    />
  );
}