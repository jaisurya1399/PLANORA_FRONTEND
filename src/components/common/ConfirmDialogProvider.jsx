import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ConfirmContext = createContext(null);
let activeConfirm = null;

export function requestConfirm(options = {}) {
  if (typeof activeConfirm !== "function") return Promise.resolve(false);
  return activeConfirm(
    typeof options === "string" ? { message: options } : options,
  );
}

export function ConfirmDialogProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({
          title: options?.title || "Confirm action",
          message: options?.message || "Are you sure you want to continue?",
          confirmText: options?.confirmText || "Confirm",
          cancelText: options?.cancelText || "Cancel",
          resolve,
        });
      }),
    [],
  );

  useEffect(() => {
    activeConfirm = confirm;
    return () => {
      activeConfirm = null;
    };
  }, [confirm]);

  const close = (result) => {
    request?.resolve(result);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={Boolean(request)}
        onClose={() => close(false)}
        aria-labelledby="planora-confirm-dialog-title"
        aria-describedby="planora-confirm-dialog-description"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="planora-confirm-dialog-title">
          {request?.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="planora-confirm-dialog-description">
            {request?.message}
          </DialogContentText>
          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            This action may change or remove existing data.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => close(false)}>{request?.cancelText}</Button>
          <Button
            onClick={() => close(true)}
            color="error"
            variant="contained"
            autoFocus
          >
            {request?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context)
    throw new Error(
      "useConfirmDialog must be used inside ConfirmDialogProvider",
    );
  return context;
}
