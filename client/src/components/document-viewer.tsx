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
    // Split content into text and HTML tags
    const tokens: { type: 'text' | 'tag'; content: string; }[] = [];
    let currentPos = 0;
    const tagRegex = /<[^>]+>/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      if (match.index > currentPos) {
        tokens.push({ 
          type: 'text', 
          content: content.slice(currentPos, match.index) 
        });
      }
      tokens.push({ type: 'tag', content: match[0] });
      currentPos = match.index + match[0].length;
    }

    if (currentPos < content.length) {
      tokens.push({ 
        type: 'text', 
        content: content.slice(currentPos) 
      });
    }

    // Sort flags by start offset in ascending order
    const sortedFlags = [...flags].sort((a, b) => a.startOffset - b.startOffset);

    // Apply highlights only to text tokens
    let currentOffset = 0;
    return tokens.map(token => {
      if (token.type === 'tag') {
        return token.content;
      }

      const text = token.content;
      const segments: { text: string; color?: string }[] = [{ text }];

      sortedFlags.forEach(flag => {
        const relativeStart = flag.startOffset - currentOffset;
        const relativeEnd = flag.endOffset - currentOffset;

        if (relativeStart < text.length && relativeEnd > 0) {
          const start = Math.max(0, relativeStart);
          const end = Math.min(text.length, relativeEnd);

          if (start < end) {
            // Split the affected segment
            const affectedSegmentIndex = segments.findIndex(seg => 
              !seg.color || seg.color === flag.color
            );

            if (affectedSegmentIndex !== -1) {
              const segment = segments[affectedSegmentIndex];
              const before = segment.text.slice(0, start);
              const middle = segment.text.slice(start, end);
              const after = segment.text.slice(end);

              segments.splice(affectedSegmentIndex, 1);
              if (before) segments.splice(affectedSegmentIndex, 0, { text: before });
              segments.splice(affectedSegmentIndex + (before ? 1 : 0), 0, { 
                text: middle, 
                color: flag.color 
              });
              if (after) segments.splice(affectedSegmentIndex + (before ? 2 : 1), 0, { text: after });
            }
          }
        }
      });

      currentOffset += text.length;
      return segments.map(segment => 
        segment.color
          ? `<span style="background-color: ${segment.color}20; border-bottom: 2px solid ${segment.color}">${segment.text}</span>`
          : segment.text
      ).join('');
    }).join('');
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