import { useNavigate } from "react-router-dom";

function SANEIllustration() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "2.5rem",
        maxWidth: "300px",
        width: "100%",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "110px",
          height: "100px",
          flexShrink: 0,
        }}
      >
        {[
          { top: "0px", left: "2px", rotate: "-8deg" },
          { top: "20px", left: "14px", rotate: "3deg" },
          { top: "40px", left: "4px", rotate: "-2deg" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "88px",
              height: "50px",
              background: "#fff",
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              top: s.top,
              left: s.left,
              transform: `rotate(${s.rotate})`,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "6px",
                background: "#e8e8e8",
                borderRadius: "3px",
                margin: "12px auto 5px",
              }}
            />
            <div
              style={{
                width: "58px",
                height: "5px",
                background: "#f0f0f0",
                borderRadius: "3px",
                margin: "0 auto",
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ fontSize: "1.3rem", color: "#1a1a1a", flexShrink: 0 }}>→</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          width: "115px",
          flexShrink: 0,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "#fff",
              borderRadius: "7px",
              padding: "6px 9px",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                background: "#E8640A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "8px",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div
              style={{
                flex: 1,
                height: "5px",
                background: "#e8e8e8",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "9px",
                background: "#f0f0f0",
                borderRadius: "3px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "2.8rem",
            letterSpacing: "0.2em",
            color: "#1a1a1a",
            marginBottom: "0.3rem",
            lineHeight: 1,
          }}
        >
          S.A.N.E
        </h1>
        <p
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#888",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Stop All Needless Effort
        </p>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          maxWidth: "300px",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "2rem",
            lineHeight: 1.2,
            color: "#1a1a1a",
            marginBottom: "0.5rem",
          }}
        >
          Work shouldn&apos;t
          <br />
          feel chaotic.
        </h2>
        <p
          style={{
            color: "#E8640A",
            fontWeight: 600,
            fontSize: "1rem",
            margin: 0,
          }}
        >
          Let&apos;s fix that.
        </p>
      </div>

      <SANEIllustration />

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          justifyContent: "center",
          marginBottom: "2.5rem",
          maxWidth: "300px",
          width: "100%",
        }}
      >
        {[
          { icon: "👁️", line1: "See what", line2: "matters" },
          { icon: "🔕", line1: "Ignore", line2: "the noise" },
          { icon: "✓", line1: "Finish what", line2: "you start" },
        ].map((f, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>{f.icon}</div>
            <p
              style={{
                fontSize: "0.73rem",
                color: "#555",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {f.line1}
              <br />
              {f.line2}
            </p>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: "300px", marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={() => navigate("/signup")}
          style={{
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          Start with clarity <span style={{ fontSize: "1.1rem" }}>→</span>
        </button>
      </div>

      <p style={{ fontSize: "0.85rem", color: "#888", margin: "0.25rem 0" }}>or</p>
      <p style={{ fontSize: "0.85rem", margin: 0 }}>
        Already using SANE?{" "}
        <span
          role="button"
          tabIndex={0}
          onClick={() => navigate("/login")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/login");
          }}
          style={{ color: "#E8640A", fontWeight: 600, cursor: "pointer" }}
        >
          Log in
        </span>
      </p>
    </div>
  );
}

export default LandingPage;
