import { useState, useEffect, useCallback, useRef } from 'react';

const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      if (!controller.signal.aborted) {
        setData(response.data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
    return () => abortRef.current?.abort();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};

export default useFetch;
