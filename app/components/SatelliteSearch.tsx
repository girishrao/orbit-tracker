"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SatelliteData } from "./Globe";

interface SatelliteSearchProps {
  onSelect: (satellite: SatelliteData | null) => void;
  /** When set, auto-triggers a search with this query (used for cross-view navigation). */
  pendingQuery?: string;
}

interface SearchResult {
  noradId: number;
  name: string;
}

export default function SatelliteSearch({ onSelect, pendingQuery }: SatelliteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPendingQuery = useRef<string | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/satellites/search?q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
        setShowDropdown(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply pendingQuery from parent (e.g. "Find Satellites" from LaunchTimeline)
  useEffect(() => {
    if (pendingQuery && pendingQuery !== lastPendingQuery.current) {
      lastPendingQuery.current = pendingQuery;
      setSelected(null);
      setQuery(pendingQuery);
      search(pendingQuery);
    }
  }, [pendingQuery, search]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = async (result: SearchResult) => {
    setShowDropdown(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/tle?id=${result.noradId}`);
      if (!res.ok) return;
      const data = await res.json();
      const sat: SatelliteData = {
        noradId: data.noradId,
        name: data.name,
        tle1: data.tle1,
        tle2: data.tle2,
      };
      setSelected(sat.name);
      setQuery(sat.name);
      onSelect(sat);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
    setShowDropdown(false);
    onSelect(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-72 pointer-events-auto">
      <div className="flex items-center bg-black/60 backdrop-blur border border-white/20 rounded">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search satellites..."
          className="flex-1 bg-transparent text-white font-mono text-xs px-3 py-2 outline-none placeholder:text-white/30"
        />
        {loading && (
          <div className="px-2">
            <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {selected && !loading && (
          <button
            onClick={handleClear}
            className="px-2 text-white/40 hover:text-white/80 text-sm"
          >
            &times;
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur border border-white/20 rounded max-h-48 overflow-y-auto z-50">
          {results.map((r) => (
            <button
              key={r.noradId}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-1.5 text-white/80 font-mono text-xs hover:bg-white/10 transition-colors"
            >
              {r.name}{" "}
              <span className="text-white/30">NORAD: {r.noradId}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur border border-white/20 rounded px-3 py-2">
          <span className="text-white/30 font-mono text-xs">
            No results found
          </span>
        </div>
      )}
    </div>
  );
}
