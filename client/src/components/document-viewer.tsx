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

  const { data: documentData, isLoading: documentLoading, error: documentError } = useQuery<SelectDocument>({
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
    if (!containerRef.current || !documentData?.content) return;

    const container = containerRef.current;

    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      const selectedText = range.toString().trim();
      if (!selectedText) return;

      let startOffset = 0;
      let currentNode = container.firstChild;

      // Function to get text content length while preserving newlines
      const getTextLength = (node: Node): number => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent?.length || 0;
        }
        let length = 0;
        for (const child of Array.from(node.childNodes)) {
          length += getTextLength(child);
        }
        return length;
      };

      // Find the start offset by traversing the DOM
      const findOffset = (node: Node | null, target: Node): number | null => {
        if (!node) return null;

        if (node === target) {
          return startOffset;
        }

        if (node.contains(target)) {
          for (const child of Array.from(node.childNodes)) {
            if (child === target || child.contains(target)) {
              const result = findOffset(child, target);
              if (result !== null) return result;
            }
            startOffset += getTextLength(child);
          }
        } else {
          startOffset += getTextLength(node);
        }

        return null;
      };

      // Calculate the actual offset
      const textStartOffset = findOffset(container, range.startContainer);
      if (textStartOffset === null) return;

      const finalStartOffset = textStartOffset + range.startOffset;
      const endOffset = finalStartOffset + selectedText.length;

      // Check for overlaps with existing flags
      const hasOverlap = flags.some(flag => 
        (finalStartOffset < flag.endOffset && endOffset > flag.startOffset)
      );

      if (hasOverlap) {
        toast({
          title: "Selection Error",
          description: "Selected text overlaps with existing highlights",
          variant: "destructive",
        });
        return;
      }

      // Verify the selected text matches the text at calculated position
      const fullText = container.textContent || '';
      const textAtPosition = fullText.substring(finalStartOffset, endOffset);

      if (textAtPosition === selectedText) {
        onTextSelect(selectedText, finalStartOffset, endOffset);
      }
    };

    container.addEventListener('mouseup', handleSelection);
    return () => container.removeEventListener('mouseup', handleSelection);
  }, [documentData?.content, flags, onTextSelect, toast]);

  const renderContent = () => {
    if (!documentData?.content) return '';

    const div = window.document.createElement('div');
    div.innerHTML = documentData.content;
    const sortedFlags = [...flags].sort((a, b) => b.startOffset - a.startOffset);

    // Function to find text node and offset
    const findTextNodeAndOffset = (node: Node, targetOffset: number): { node: Text | null; offset: number } => {
      let currentOffset = 0;

      const walker = window.document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      let currentNode: Text | null = walker.nextNode() as Text;

      while (currentNode) {
        const nodeLength = currentNode.length;
        if (currentOffset + nodeLength > targetOffset) {
          return { node: currentNode, offset: targetOffset - currentOffset };
        }
        currentOffset += nodeLength;
        currentNode = walker.nextNode() as Text;
      }

      return { node: null, offset: 0 };
    };

    // Apply highlights
    for (const flag of sortedFlags) {
      try {
        const { node: startNode, offset: startOffset } = findTextNodeAndOffset(div, flag.startOffset);
        const { node: endNode, offset: endOffset } = findTextNodeAndOffset(div, flag.endOffset);

        if (startNode && endNode) {
          const range = window.document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          // Verify the text matches before applying highlight
          if (range.toString() === flag.text) {
            const mark = window.document.createElement('mark');
            mark.style.backgroundColor = `${flag.color}20`;
            mark.style.boxShadow = `inset 0 -2px 0 ${flag.color}`;
            mark.style.borderRadius = '2px';
            mark.style.padding = '2px';
            mark.style.margin = '-2px';
            mark.style.display = 'inline-block';
            mark.className = 'highlight-mark';

            range.surroundContents(mark);
          }
        }
      } catch (error) {
        console.error('Failed to apply highlight:', error);
      }
    }

    return div.innerHTML;
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

  if (documentLoading || flagsLoading || !documentData) {
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