import { useCallback, useEffect, useMemo, useState } from "react";
import { clearLogs, clearSelectedLogs, getLogs } from "./adminApi";
import { goToLogin, isAdminSessionExpired } from "./adminHelpers";

const sortLogs = (logs, sortType) => {
  if (sortType === "az") return [...logs].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  if (sortType === "za") return [...logs].sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
  if (sortType === "new") return [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortType === "old") return [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  return logs;
};

export default function useActionLogs({ canClearLogs }) {
  const [actionLog, setActionLog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(10);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("");
  const [clearLogsConfirm, setClearLogsConfirm] = useState(false);
  const [clearSelectedConfirm, setClearSelectedConfirm] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await getLogs();
      if (isAdminSessionExpired(response)) return goToLogin();
      if (response.ok) setActionLog(await response.json());
    } catch (error) {
      console.error("Server connecting...", error);
    }
  }, []);

  useEffect(() => setCurrentPage(1), [search, sortType, displayCount]);

  const filteredLogs = useMemo(() => {
    const matchingLogs = actionLog.filter((row) =>
      Object.values(row).some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
    );
    return sortLogs(matchingLogs, sortType);
  }, [actionLog, search, sortType]);

  const toggleAll = useCallback(() => {
    if (filteredLogs.length === 0 || !canClearLogs) return;
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLogs.map((item) => item.id)));
    }
    setSelectAll(!selectAll);
  }, [canClearLogs, filteredLogs, selectAll]);

  const toggleRow = useCallback((id) => {
    if (!canClearLogs) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectAll(next.size > 0 && next.size === filteredLogs.length);
      return next;
    });
  }, [canClearLogs, filteredLogs.length]);

  const executeClearLogs = async () => {
    if (!canClearLogs) return;
    try {
      const response = await clearLogs();
      if (response.ok) {
        setActionLog([]);
        setSelected(new Set());
        setSelectAll(false);
      }
    } catch (error) {
      console.error("Clear logs failed:", error);
    } finally {
      setClearLogsConfirm(false);
    }
  };

  const executeClearSelected = async () => {
    if (!canClearLogs || selected.size === 0) return;
    try {
      const response = await clearSelectedLogs(Array.from(selected));
      if (response.ok) {
        setActionLog((current) => current.filter((item) => !selected.has(item.id)));
        setSelected(new Set());
        setSelectAll(false);
      }
    } catch (error) {
      console.error("Clear selected logs failed:", error);
    } finally {
      setClearSelectedConfirm(false);
    }
  };

  return {
    fetchLogs,
    showAllMenuState: { selected, setClearSelectedConfirm, setClearLogsConfirm },
    clearLogsConfirm,
    setClearLogsConfirm,
    clearSelectedConfirm,
    setClearSelectedConfirm,
    executeClearLogs,
    executeClearSelected,
    recentActionsState: {
      search,
      setSearch,
      setSortType,
      filteredLogs,
      currentPage,
      displayCount,
      selectAll,
      toggleAll,
      toggleRow,
      setCurrentPage,
      setDisplayCount
    }
  };
}
