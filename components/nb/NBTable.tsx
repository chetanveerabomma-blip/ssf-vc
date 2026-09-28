import React from "react";

export interface NBTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const NBTable: React.FC<NBTableProps> = ({ headers, children, className = "" }) => {
  return (
    <div className={`overflow-x-auto border-[3px] border-nb-ink shadow-[4px_4px_0px_#0A0A0A] bg-white ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-nb-yellow border-b-[3px] border-nb-ink font-heading text-xs uppercase tracking-wider font-black">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-3 border-r-[2px] border-nb-ink last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-[2px] divide-nb-ink font-mono text-xs">{children}</tbody>
      </table>
    </div>
  );
};
