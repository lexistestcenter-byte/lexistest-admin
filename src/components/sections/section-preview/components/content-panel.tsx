"use client";

import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import type { ContentBlockPreview } from "../types";

interface ContentPanelProps {
  activeBlock: ContentBlockPreview | null;
  contentBlocks: ContentBlockPreview[];
}

export function ContentPanel({ activeBlock, contentBlocks }: ContentPanelProps) {
  if (activeBlock) {
    if (activeBlock.content_type === "passage") {
      return (
        <div className="p-4 min-h-full flex flex-col">
          <div className="bg-white rounded-lg border p-6 flex-1">
            {activeBlock.passage_title ? (
              <h2 className="text-lg font-bold mb-4">{activeBlock.passage_title}</h2>
            ) : null}
            {activeBlock.passage_content ? (
              <div
                className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeBlock.passage_content) }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">No passage content entered.</p>
            )}
            {activeBlock.passage_footnotes ? (
              <div
                className="mt-4 pt-3 border-t text-xs text-gray-500 italic prose prose-xs max-w-none [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeBlock.passage_footnotes) }}
              />
            ) : null}
          </div>
        </div>
      );
    }

    if (activeBlock.content_type === "audio") {
      const hasPassage = activeBlock.passage_title || activeBlock.passage_content;
      return (
        <>
          {activeBlock.audio_url && (
            <audio src={getCdnUrl(activeBlock.audio_url)} autoPlay />
          )}
          {hasPassage && (
            <div className="p-4 min-h-full flex flex-col">
              <div className="bg-white rounded-lg border p-6 flex-1">
                {activeBlock.passage_title ? (
                  <h2 className="text-lg font-bold mb-4">{activeBlock.passage_title}</h2>
                ) : null}
                {activeBlock.passage_content ? (
                  <div
                    className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeBlock.passage_content) }}
                  />
                ) : null}
                {activeBlock.passage_footnotes ? (
                  <div
                    className="mt-4 pt-3 border-t text-xs text-gray-500 italic prose prose-xs max-w-none [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeBlock.passage_footnotes) }}
                  />
                ) : null}
              </div>
            </div>
          )}
        </>
      );
    }
  }

  // Fallback: check if any blocks exist
  if (contentBlocks.length > 0) {
    const firstBlock = contentBlocks[0];
    if (firstBlock.content_type === "passage") {
      return (
        <div className="p-4 min-h-full flex flex-col">
          <div className="bg-white rounded-lg border p-6 flex-1">
            {firstBlock.passage_title ? (
              <h2 className="text-lg font-bold mb-4">{firstBlock.passage_title}</h2>
            ) : null}
            {firstBlock.passage_content ? (
              <div
                className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(firstBlock.passage_content) }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">No passage content entered.</p>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="p-4 min-h-full flex flex-col">
      <div className="bg-white rounded-lg border p-6 flex-1">
        <p className="text-sm text-gray-400 italic">No passage content entered.</p>
      </div>
    </div>
  );
}
