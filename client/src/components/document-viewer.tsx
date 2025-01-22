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
    // Create a temporary div to parse HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Sort flags by start offset in descending order to preserve positions
    const sortedFlags = [...flags].sort((a, b) => b.startOffset - a.startOffset);

    // Process text nodes recursively
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        let currentPos = 0;

        // Apply highlights to text node
        sortedFlags.forEach(flag => {
          if (flag.startOffset <= currentPos + text.length && flag.endOffset >= currentPos) {
            const start = Math.max(0, flag.startOffset - currentPos);
            const end = Math.min(text.length, flag.endOffset - currentPos);

            if (start < end) {
              const before = text.slice(0, start);
              const highlighted = text.slice(start, end);
              const after = text.slice(end);

              const span = document.createElement('span');
              span.className = 'flag-highlight';
              span.style.backgroundColor = `${flag.color}33`;
              span.style.borderBottom = `2px solid ${flag.color}`;
              span.textContent = highlighted;

              const fragment = document.createDocumentFragment();
              if (before) fragment.appendChild(document.createTextNode(before));
              fragment.appendChild(span);
              if (after) fragment.appendChild(document.createTextNode(after));

              node.parentNode?.replaceChild(fragment, node);
            }
          }
        });
      } else {
        // Recursively process child nodes
        Array.from(node.childNodes).forEach(processNode);
      }
    };

    processNode(tempDiv);
    return tempDiv.innerHTML;
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