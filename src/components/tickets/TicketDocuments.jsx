import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

import {
  deleteTicketDocument,
  getTicketDocuments,
  uploadTicketDocument,
} from "../../api/ticketApi";
import { BORDER, RADIUS } from "../../theme/colors";

export default function TicketDocuments({ ticketId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const data = await getTicketDocuments(ticketId);

      setDocuments(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      console.error("Failed to load documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadDocuments();
    }
  }, [ticketId]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      await uploadTicketDocument(ticketId, file);

      await loadDocuments();
    } catch (error) {
      console.error("Failed to upload document", error);
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await deleteTicketDocument(ticketId, documentId);

      setDocuments((prev) => prev.filter((item) => item.id !== documentId));
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };

  const handleDownload = (document) => {
    const url = document.downloadUrl || document.url || document.fileUrl;

    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${BORDER}`,
        borderRadius: `${RADIUS.card}px`,
        p: 3,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Attachments
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Documents attached to this ticket
          </Typography>
        </Box>

        <Button
          variant="contained"
          component="label"
          startIcon={
            uploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AttachFileIcon />
            )
          }
          disabled={uploading}
        >
          Upload
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileSelect}
          />
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${BORDER}`,
            borderRadius: `${RADIUS.card}px`,
            p: 5,
            textAlign: "center",
          }}
        >
          <AttachFileIcon
            sx={{
              fontSize: 40,
              color: "text.secondary",
            }}
          />

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No attachments
          </Typography>
        </Box>
      ) : (
        <Box>
          {documents.map((document, index) => (
            <Box
              key={document.id || index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <AttachFileIcon color="primary" />

              <Box flex={1}>
                <Typography fontWeight={600}>
                  {document.fileName ||
                    document.name ||
                    document.originalFileName ||
                    "Attachment"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {document.fileSize
                    ? `${(document.fileSize / 1024).toFixed(1)} KB`
                    : ""}
                </Typography>
              </Box>

              <IconButton
                color="primary"
                onClick={() => handleDownload(document)}
              >
                <DownloadIcon />
              </IconButton>

              <IconButton
                color="error"
                onClick={() => handleDelete(document.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
