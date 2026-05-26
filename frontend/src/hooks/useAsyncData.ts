import { useState, useEffect } from 'react';
import { ApiError } from '@/lib/errors';

interface AsyncDataState<T> {
  data: T;
  isLoading: boolean;
  error: ApiError | null;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  defaultValue: T,
  deps: React.DependencyList = [],
): AsyncDataState<T> {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError(0, err instanceof Error ? err.message : String(err)),
          );
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error };
}
