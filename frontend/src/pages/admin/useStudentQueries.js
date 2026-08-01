import { useCallback, useMemo, useState } from "react";
import { getStudentQueries } from "./adminApi";
import { STUDENT_QUERY_SEEN_KEY_PREFIX } from "./adminConstants";
import {
  getLatestStudentQueryIdsByEmail,
  goToLogin,
  isAdminSessionExpired,
  normalizeQueryEmail,
  readStudentQuerySeenMap
} from "./adminHelpers";

export default function useStudentQueries({ authUser, canMonitor }) {
  const [studentQueries, setStudentQueries] = useState([]);
  const [expandedEmails, setExpandedEmails] = useState(new Set());
  const [querySearch, setQuerySearch] = useState("");
  const [querySortType, setQuerySortType] = useState("new");
  const [queryCurrentPage, setQueryCurrentPage] = useState(1);
  const [queryDisplayCount, setQueryDisplayCount] = useState(10);
  const [newStudentQueryEmails, setNewStudentQueryEmails] = useState(new Set());

  const studentQuerySeenKey = useMemo(() => (
    `${STUDENT_QUERY_SEEN_KEY_PREFIX}.${authUser?.id || authUser?.loginIdentifier || authUser?.email || "default"}`
  ), [authUser?.id, authUser?.loginIdentifier, authUser?.email]);

  const syncNewStudentQueryStatus = useCallback((queries) => {
    const latestByEmail = getLatestStudentQueryIdsByEmail(queries);
    const queryEmails = Object.keys(latestByEmail);
    if (queryEmails.length === 0) {
      setNewStudentQueryEmails(new Set());
      return;
    }

    const seenByEmail = readStudentQuerySeenMap(studentQuerySeenKey);
    setNewStudentQueryEmails(new Set(queryEmails.filter((email) => seenByEmail[email] !== latestByEmail[email])));
  }, [studentQuerySeenKey]);

  const fetchStudentQueries = useCallback(async () => {
    if (!canMonitor) return;
    try {
      const response = await getStudentQueries();
      if (isAdminSessionExpired(response)) return goToLogin();
      if (response.ok) {
        const queries = await response.json();
        setStudentQueries(queries);
        syncNewStudentQueryStatus(queries);
      }
    } catch (error) {
      console.error("Student query fetch failed:", error);
    }
  }, [canMonitor, syncNewStudentQueryStatus]);

  const rememberStudentQueryEmail = useCallback((email, queries = studentQueries) => {
    const normalizedEmail = normalizeQueryEmail(email);
    if (!normalizedEmail) return;

    const latestByEmail = getLatestStudentQueryIdsByEmail(queries);
    if (!latestByEmail[normalizedEmail]) return;

    const seenByEmail = readStudentQuerySeenMap(studentQuerySeenKey);
    const nextSeenByEmail = { ...seenByEmail, [normalizedEmail]: latestByEmail[normalizedEmail] };
    try { localStorage.setItem(studentQuerySeenKey, JSON.stringify(nextSeenByEmail)); } catch { /* storage can be unavailable */ }
    setNewStudentQueryEmails((current) => {
      const next = new Set(current);
      next.delete(normalizedEmail);
      return next;
    });
  }, [studentQueries, studentQuerySeenKey]);

  const updateQuerySearch = (value) => {
    setQuerySearch(value);
    setQueryCurrentPage(1);
  };

  const updateQuerySortType = (value) => {
    setQuerySortType(value);
    setQueryCurrentPage(1);
  };

  const updateQueryDisplayCount = (value) => {
    setQueryDisplayCount(value);
    setQueryCurrentPage(1);
  };

  const groupedQueriesArray = useMemo(() => {
    const processedQueries = studentQueries
      .filter((query) =>
        Object.values(query).some((value) => String(value || "").toLowerCase().includes(querySearch.toLowerCase()))
      )
      .sort((a, b) => querySortType === "old" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));

    const groupedQueriesMap = processedQueries.reduce((acc, query) => {
      const email = normalizeQueryEmail(query.email || "unknown");
      if (!acc[email]) acc[email] = { email, queries: [], totalCount: 0, lastActiveDate: query.date };
      acc[email].queries.push(query);
      acc[email].totalCount += 1;
      if (new Date(query.date) > new Date(acc[email].lastActiveDate)) acc[email].lastActiveDate = query.date;
      return acc;
    }, {});
    return Object.values(groupedQueriesMap);
  }, [querySearch, querySortType, studentQueries]);

  const toggleEmailExpanded = (email) => {
    setExpandedEmails((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  return {
    fetchStudentQueries,
    hasNewStudentQueries: newStudentQueryEmails.size > 0,
    studentQueriesProps: {
      querySearch,
      setQuerySearch: updateQuerySearch,
      setQuerySortType: updateQuerySortType,
      groupedQueriesArray,
      queryCurrentPage,
      queryDisplayCount,
      expandedEmails,
      newStudentQueryEmails,
      rememberStudentQueryEmail,
      toggleEmailExpanded,
      setQueryCurrentPage,
      setQueryDisplayCount: updateQueryDisplayCount
    }
  };
}
