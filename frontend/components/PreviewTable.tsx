"use client";

import { useState } from "react";

interface Props {
  rows: Record<string, string>[];
}

// Windowed rendering: only rows near the viewport exist in the DOM, with
// spacer rows keeping the scrollbar length correct. The math relies on a
// fixed row height.
const ROW_HEIGHT = 41;
const VIEWPORT = 420;
const OVERSCAN = 15;

export default function PreviewTable({ rows }: Props) {
  const [start, setStart] = useState(0);

  if (rows.length === 0) {
    return <p className="text-ink-mid">No rows found in this file.</p>;
  }

  const headers = Object.keys(rows[0]);

  const visibleCount = Math.ceil(VIEWPORT / ROW_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(rows.length, start + visibleCount);
  const visibleRows = rows.slice(start, end);

  const padTop = start * ROW_HEIGHT;
  const padBottom = (rows.length - end) * ROW_HEIGHT;

  // State updates only when the window start index changes,
  // not on every scrolled pixel.
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const next = Math.max(
      0,
      Math.floor(e.currentTarget.scrollTop / ROW_HEIGHT) - OVERSCAN
    );
    if (next !== start) setStart(next);
  }

  return (
    // Solid background — backdrop-filter on a scroll container repaints
    // every frame while scrolling.
    <div className="rounded-2xl overflow-hidden bg-surface border border-line">
      <div className="max-h-[420px] overflow-auto" onScroll={handleScroll}>
        <table className="table-fixed text-sm text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="w-44 px-4 py-3 font-semibold whitespace-nowrap truncate text-ink-hi border-b border-line"
                  title={h}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {padTop > 0 && (
              <tr style={{ height: padTop }}>
                <td colSpan={headers.length} />
              </tr>
            )}

            {visibleRows.map((row, i) => (
              <tr
                key={start + i}
                style={{ height: ROW_HEIGHT }}
                className="hover:bg-line-soft"
              >
                {headers.map((h) => (
                  <td
                    key={h}
                    title={row[h]}
                    className="px-4 whitespace-nowrap truncate text-ink-mid border-b border-line-soft"
                  >
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}

            {padBottom > 0 && (
              <tr style={{ height: padBottom }}>
                <td colSpan={headers.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
