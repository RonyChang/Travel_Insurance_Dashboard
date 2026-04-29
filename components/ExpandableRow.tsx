"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";

interface ExpandableRowProps {
  isOpen: boolean;
  onToggle: () => void;
  summary: ReactNode;
  children: ReactNode;
}

export default function ExpandableRow({ isOpen, onToggle, summary, children }: ExpandableRowProps) {
  return (
    <>
      <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        {summary}
        <td className="px-4 py-2 text-center">
          <ChevronDown
            size={18}
            className={`mx-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-gray-50 border-b">
          <td colSpan={100} className="px-4 py-4">
            {children}
          </td>
        </tr>
      )}
    </>
  );
}
