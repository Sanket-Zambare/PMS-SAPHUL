import { useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { importAPI } from "../services/api";

const TEMPLATES = {
  tasks: {
    columns: ["title", "description", "project_name", "assigned_to_email", "start_date", "due_date", "status"],
    notes: "project_name must match exactly. status: TODO | IN_PROGRESS | DONE | BLOCKED. Dates: YYYY-MM-DD",
  },
  projects: {
    columns: ["name", "description", "methodology", "start_date", "end_date", "status"],
    notes: "methodology: WATERFALL | AGILE | HYBRID. status: PENDING | IN_PROGRESS | COMPLETED. Dates: YYYY-MM-DD",
  },
};

function ImportModal({ show, onHide, type = "tasks", onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const template = TEMPLATES[type];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
      setError("");
      setResult(null);
    } else {
      setError("Please select a .xlsx or .xls file");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = type === "tasks"
        ? await importAPI.importTasks(fd)
        : await importAPI.importProjects(fd);
      setResult(res.data);
      if (res.data.created > 0) onSuccess?.();
    } catch (e) {
      setError(e.response?.data?.detail || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    onHide();
  };

  const downloadTemplate = () => {
    const header = template.columns.join("\t");
    const example = type === "tasks"
      ? "Fix login bug\tDescription here\tMy Project\tuser@email.com\t2026-07-01\t2026-07-15\tTODO"
      : "New Website\tProject description\tAGILE\t2026-07-01\t2026-09-30\tPENDING";
    const content = `${header}\n${example}`;
    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Import {type === "tasks" ? "Tasks" : "Projects"} from Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Column guide */}
        <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Required columns (Row 1 = headers):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {template.columns.map((col) => (
              <span key={col} style={{ background: "#e9ecef", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontFamily: "monospace" }}>
                {col}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{template.notes}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={downloadTemplate}
            style={{ background: "none", border: "1px solid #E8640A", color: "#E8640A", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}
          >
            Download sample template (.tsv → open in Excel, Save As .xlsx)
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          style={{ display: "block", marginBottom: 8 }}
        />
        {file && (
          <div style={{ fontSize: 13, color: "#555" }}>Selected: <strong>{file.name}</strong></div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#fee2e2", borderRadius: 6, color: "#dc2626", fontSize: 13 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: "8px 12px", background: "#d1fae5", borderRadius: 6, color: "#059669", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              {result.created} {type} created successfully
            </div>
            {result.failed?.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: "auto" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
                  {result.failed.length} rows failed:
                </div>
                {result.failed.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#666", padding: "2px 0" }}>
                    Row {f.row}: {f.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleImport} disabled={!file || loading}>
          {loading ? "Importing..." : "Import"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ImportModal;
