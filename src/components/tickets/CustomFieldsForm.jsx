import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { useMemo } from "react";
const parseOptions = (json) => {
  try {
    const x = JSON.parse(json || "[]");
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
};
export default function CustomFieldsForm({
  configs = [],
  screenFields = [],
  values = {},
  onChange,
}) {
  const allowed = useMemo(
    () =>
      screenFields?.length
        ? new Set(
            screenFields
              .filter((f) => f.visible !== false)
              .map((f) => f.fieldKey),
          )
        : null,
    [screenFields],
  );
  const visible = useMemo(
    () =>
      configs.filter(
        (c) => c.visible !== false && (!allowed || allowed.has(c.fieldKey)),
      ),
    [configs, allowed],
  );
  if (!visible.length) return null;
  const set = (key, value) => onChange({ ...values, [key]: value });
  return (
    <Box
      sx={{
        gridColumn: { xs: "span 1", sm: "span 2" },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 3,
      }}
    >
      {visible.map((c) => {
        const value = values[c.fieldKey] ?? "";
        if (c.fieldType === "BOOLEAN")
          return (
            <FormControlLabel
              key={c.fieldId}
              control={
                <Checkbox
                  checked={value === true || value === "true"}
                  onChange={(e) =>
                    set(c.fieldKey, e.target.checked ? "true" : "false")
                  }
                />
              }
              label={`${c.fieldName}${c.required ? " *" : ""}`}
            />
          );
        if (c.fieldType === "SELECT")
          return (
            <FormControl key={c.fieldId} fullWidth required={!!c.required}>
              <InputLabel>{c.fieldName}</InputLabel>
              <Select
                value={value}
                label={c.fieldName}
                onChange={(e) => set(c.fieldKey, e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {parseOptions(c.optionsJson).map((o, i) => (
                  <MenuItem key={i} value={typeof o === "object" ? o.value : o}>
                    {typeof o === "object" ? o.label || o.value : o}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        if (c.fieldType === "MULTI_SELECT")
          return (
            <FormControl key={c.fieldId} fullWidth>
              <InputLabel>{c.fieldName}</InputLabel>
              <Select
                multiple
                value={value ? String(value).split(",").filter(Boolean) : []}
                label={c.fieldName}
                onChange={(e) => set(c.fieldKey, e.target.value.join(","))}
              >
                {parseOptions(c.optionsJson).map((o, i) => (
                  <MenuItem key={i} value={typeof o === "object" ? o.value : o}>
                    {typeof o === "object" ? o.label || o.value : o}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        const type =
          c.fieldType === "NUMBER"
            ? "number"
            : c.fieldType === "DATE"
              ? "date"
              : c.fieldType === "DATETIME"
                ? "datetime-local"
                : "text";
        return (
          <TextField
            key={c.fieldId}
            fullWidth
            required={!!c.required}
            type={type}
            label={c.fieldName}
            value={value}
            onChange={(e) => set(c.fieldKey, e.target.value)}
            multiline={c.fieldType === "TEXTAREA"}
            minRows={c.fieldType === "TEXTAREA" ? 3 : undefined}
            InputLabelProps={
              type.includes("date") ? { shrink: true } : undefined
            }
            placeholder={c.fieldType === "URL" ? "https://example.com" : ""}
          />
        );
      })}
    </Box>
  );
}
