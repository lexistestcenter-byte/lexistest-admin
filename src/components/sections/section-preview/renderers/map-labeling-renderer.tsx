"use client";

import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function MapLabelingRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  const imageUrl = getCdnUrl(String(od.image_url || ""));
  const labels = Array.isArray(od.labels) ? od.labels as string[] : [];
  const mapItems = Array.isArray(od.items)
    ? (od.items as { number: number; statement: string }[])
    : [];

  if (!imageUrl && mapItems.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">No map labeling data available.</p>
      </div>
    );
  }

  const numPrefix = item.startNum === item.endNum
    ? `${item.startNum}`
    : `${item.startNum}–${item.endNum}`;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
        <p className="text-[15px]">
          <span className="font-bold mr-2">{numPrefix}</span>
          The map has {labels.length} labels ({labels.join(", ")}). Choose the correct label.
        </p>
      </div>

      {/* Image + Table Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Map Image */}
        <div className="border rounded-lg p-2 bg-slate-50 flex items-center justify-center min-h-[200px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Map"
              className="max-w-full h-auto max-h-[300px] rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <p className="text-sm text-gray-400">No image</p>
          )}
        </div>

        {/* Right: Answer Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">#</th>
                <th className="px-2 py-1.5 text-left font-medium">Item</th>
                {labels.map((label) => (
                  <th key={label} className="px-2 py-1.5 text-center font-medium w-8">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mapItems.map((entry, idx) => {
                const num = item.startNum + idx;
                const selectedLabel = answers[num] || "";
                return (
                  <tr key={num} className="border-t">
                    <td className="px-2 py-1.5 font-bold">{num}</td>
                    <td className="px-2 py-1.5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(entry.statement)) }} />
                    {labels.map((label) => (
                      <td key={label} className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                            selectedLabel === label
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setAnswer(num, selectedLabel === label ? "" : label)}
                        >
                          {selectedLabel === label && "\u2713"}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
