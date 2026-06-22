import { useState, useRef, useEffect } from "react";

function MentionTextarea({ value, onChange, users = [], placeholder, rows = 2, onKeyDown, style }) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name &&
      mentionQuery &&
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;

    onChange(val);

    // Detect @ symbol before cursor
    const textBeforeCursor = val.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const query = textBeforeCursor.slice(atIndex + 1);
      // Only show if no space in query (still typing the name)
      if (!query.includes(" ") || query.length < 20) {
        setMentionStart(atIndex);
        setMentionQuery(query);
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
    setMentionQuery("");
    setMentionStart(-1);
  };

  const handleSelect = (user) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1); // +1 for @
    const newValue = `${before}@${user.name} ${after}`;
    onChange(newValue);
    setShowDropdown(false);
    setMentionQuery("");
    setMentionStart(-1);
    // Re-focus
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = (before + `@${user.name} `).length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        textareaRef.current && !textareaRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <textarea
        ref={textareaRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShowDropdown(false);
          onKeyDown?.(e);
        }}
        className="form-control"
        style={{ fontSize: "0.84rem", resize: "none", ...style }}
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            zIndex: 1000,
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 200,
            maxHeight: 200,
            overflowY: "auto",
            marginBottom: 4,
          }}
        >
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(u); }}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fff6ef")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <span style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#E8640A", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {u.name[0].toUpperCase()}
              </span>
              <span style={{ fontWeight: 600 }}>{u.name}</span>
            </div>
          ))}
        </div>
      )}
      {showDropdown && filteredUsers.length === 0 && mentionQuery.length > 0 && (
        <div style={{
          position: "absolute", bottom: "100%", left: 0, zIndex: 1000,
          background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
          padding: "8px 14px", fontSize: 12, color: "#aaa", marginBottom: 4,
        }}>
          No users found
        </div>
      )}
    </div>
  );
}

export default MentionTextarea;
