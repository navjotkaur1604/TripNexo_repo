import { useState, useEffect, useCallback } from 'react';

export function useFetch(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState('');

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetcher(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to load data');
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute, setData };
}
