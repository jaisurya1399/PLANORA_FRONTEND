import { useCallback, useState } from "react";

const useApiRequest = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);

        setData(result);

        return result;
      } catch (err) {
        const normalizedError = {
          message:
            err?.message ||
            "Something went wrong while processing the request.",
          status: err?.status ?? null,
          data: err?.data ?? null,
          originalError: err,
        };

        setError(normalizedError);

        throw normalizedError;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    setData,
    loading,
    error,
    execute,
    reset,
  };
};

export default useApiRequest;
