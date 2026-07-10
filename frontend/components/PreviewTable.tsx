"use client";

interface Props {
  rows: Record<string, string>[];
}

export default function PreviewTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-white/60">No rows found in this file.</p>;
  }

  // column names = the keys of the first row (whatever the CSV happened to have)
  const headers = Object.keys(rows[0]);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* this scroll box gives BOTH vertical (max-h) and horizontal (overflow) scroll */}
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          {/* sticky top-0 keeps the header row visible while you scroll down */}
          <thead className="sticky top-0 z-10 bg-[#141024]/90 backdrop-blur-md">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold whitespace-nowrap text-white/90 border-b border-white/10"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                {headers.map((h) => (
                  <td
                    key={h}
                    className="px-4 py-2.5 whitespace-nowrap text-white/70 border-b border-white/5"
                  >
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}