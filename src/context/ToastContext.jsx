import { Alert, Snackbar } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong. Please try again. If the problem continues, refresh the page.";

const toUserMessage = (error) => {
  if (!error) return DEFAULT_ERROR_MESSAGE;

  const candidate =
    error?.message ||
    error?.reason?.message ||
    (typeof error === "string" ? error : "");

  if (!candidate || candidate.length > 300) {
    return DEFAULT_ERROR_MESSAGE;
  }

  // Never surface browser/runtime implementation details to the user.
  if (
    /nullpointerexception|referenceerror|typeerror|syntaxerror|stack trace|java\.|springframework|hibernate|jdbc|\bsql\b| at com\./i.test(
      candidate,
    )
  ) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return candidate;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const lastToastRef = useRef({ message: "", time: 0 });

  const showToast = useCallback((message, severity = "info") => {
    const safeMessage = toUserMessage({ message });
    const now = Date.now();

    // Prevent duplicate notifications when a page and a global handler
    // report the same failure within a short period.
    if (
      lastToastRef.current.message === safeMessage &&
      now - lastToastRef.current.time < 1500
    ) {
      return;
    }

    lastToastRef.current = { message: safeMessage, time: now };

    setToast({
      open: true,
      message: safeMessage,
      severity,
    });
  }, []);

  const success = useCallback(
    (message) => showToast(message, "success"),
    [showToast],
  );

  const error = useCallback(
    (message) => showToast(message, "error"),
    [showToast],
  );

  const warning = useCallback(
    (message) => showToast(message, "warning"),
    [showToast],
  );

  const info = useCallback(
    (message) => showToast(message, "info"),
    [showToast],
  );

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      // A promise rejection that was already handled by a page should not
      // normally reach this listener. This catches genuinely unhandled cases.
      event.preventDefault?.();
      showToast(event.reason?.message || DEFAULT_ERROR_MESSAGE, "error");
    };

    const handleWindowError = (event) => {
      showToast(event.error?.message || DEFAULT_ERROR_MESSAGE, "error");
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleWindowError);
    };
  }, [showToast]);

  const closeToast = useCallback(() => {
    setToast((previous) => ({
      ...previous,
      open: false,
    }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      <Snackbar
        role="status"
        aria-live={toast.severity === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        open={toast.open}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          elevation={6}
          sx={{ maxWidth: 520 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};

export default ToastContext;
