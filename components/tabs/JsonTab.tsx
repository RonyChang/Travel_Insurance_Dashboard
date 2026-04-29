"use client";

import { InsuranceProduct } from "@/lib/types";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface JsonTabProps {
  product: InsuranceProduct;
}

export default function JsonTab({ product }: JsonTabProps) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const jsonString = JSON.stringify(product, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple search highlighting
  const getHighlightedJson = () => {
    if (!searchTerm) return jsonString;

    const lines = jsonString.split("\n");
    return lines
      .map((line) => {
        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
          return `>>> ${line}`;
        }
        return line;
      })
      .join("\n");
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-gray-50 rounded border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar en JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* JSON Display */}
      <div className="border border-gray-200 rounded overflow-hidden bg-gray-900">
        <pre className="min-h-[48rem] resize-y overflow-auto p-4 text-xs text-gray-100 font-mono whitespace-pre-wrap break-words">
          {getHighlightedJson().split("\n").map((line, idx) => {
            const isHighlighted = line.startsWith(">>>");
            const displayLine = isHighlighted ? line.substring(4) : line;

            return (
              <div
                key={idx}
                className={isHighlighted ? "bg-yellow-900 text-yellow-200" : ""}
              >
                {displayLine}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-gray-700">
        <p>
          Total de caracteres: <strong>{jsonString.length.toLocaleString()}</strong>
        </p>
      </div>
    </div>
  );
}
