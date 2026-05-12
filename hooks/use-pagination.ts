"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to manage pagination state and auto-reset when dependencies change.
 * 
 * @param resetDeps Array of dependencies that, when changed, will reset the page to 1.
 * @param defaultPageSize Initial page size.
 * @returns An object containing pagination state and setters.
 */
export function usePaginationState(resetDeps: unknown[] = [], defaultPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Auto-reset to page 1 when filter dependencies change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
  };
}
