import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

/** Desktop-sized CSS illustration (scattered cards → checklist) */
function SANEIllustrationDesktop() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2rem",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "180px",
          height: "160px",
          flexShrink: 0,
        }}
      >
        {[
          { top: "0px", left: "0px", rotate: "-8deg" },
          { top: "30px", left: "20px", rotate: "4deg" },
          { top: "65px", left: "8px", rotate: "-3deg" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "150px",
              height: "80px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              top: s.top,
              left: s.left,
              transform: `rotate(${s.rotate})`,
            }}
          >
            <div
              style={{
                width: "60px",
                height: "8px",
                background: "#e8e8e8",
                borderRadius: "4px",
                margin: "18px auto 8px",
              }}
            />
            <div
              style={{
                width: "100px",
                height: "7px",
                background: "#f0f0f0",
                borderRadius: "4px",
                margin: "0 auto 6px",
              }}
            />
            <div
              style={{
                width: "80px",
                height: "6px",
                background: "#f5f5f5",
                borderRadius: "4px",
                margin: "0 auto",
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: "1.8rem",
          color: "#1a1a1a",
          flexShrink: 0,
          fontWeight: 300,
        }}
        aria-hidden
      >
        →
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "200px",
          flexShrink: 0,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#fff",
              borderRadius: "10px",
              padding: "12px 14px",
              border: "1px solid #f0f0f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#E8640A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "11px",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div
              style={{
                flex: 1,
                height: "8px",
                background: "#e8e8e8",
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                width: "18px",
                height: "14px",
                background: "#f0f0f0",
                borderRadius: "4px",
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

  const pillars = [
    { icon: "👁️", line1: "See what", line2: "matters" },
    { icon: "🔕", line1: "Ignore", line2: "the noise" },
    { icon: "✓", line1: "Finish what", line2: "you start" },
  ];

  return (
    <div id="landing-top" className="landing-v2-root">
      <Navbar />

      {/* ----- Hero ----- */}
      <div
        className="hero-layout"
        style={{
          minHeight: "100vh",
          paddingTop: "80px",
          background: "#F5F4F0",
          display: "flex",
          alignItems: "center",
          padding: "80px 4rem 4rem",
          gap: "4rem",
          boxSizing: "border-box",
        }}
      >
        <div
          className="hero-copy"
          style={{
            flex: "0 0 50%",
            maxWidth: "520px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#FEF3EA",
              color: "#E8640A",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderRadius: "999px",
              padding: "0.35rem 1rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(232,100,10,0.2)",
            }}
          >
            Stop All Needless Effort
          </div>

          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
              lineHeight: 1.1,
              color: "#1a1a1a",
              marginBottom: "0.5rem",
            }}
          >
            Work shouldn&apos;t
            <br />
            feel chaotic.
          </h1>

          <p
            style={{
              color: "#E8640A",
              fontWeight: 700,
              fontSize: "1.2rem",
              marginBottom: "1rem",
            }}
          >
            Let&apos;s fix that.
          </p>

          <p
            style={{
              color: "#555",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
              maxWidth: "400px",
            }}
          >
            SANE helps you cut through the noise, focus on what matters, and finish
            what you start.
          </p>

          <div
            className="hero-pillars"
            style={{
              display: "flex",
              gap: "2rem",
              marginBottom: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            {pillars.map((f, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>{f.icon}</div>
                <p
                  style={{
                    fontSize: "0.78rem",
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

          <button
            type="button"
            className="btn btn-primary landing-hero-cta"
            onClick={() => navigate("/signup")}
            style={{
              fontSize: "0.95rem",
              padding: "0.8rem 1.75rem",
              borderRadius: "10px",
              marginBottom: "1rem",
              width: "auto",
              minWidth: "220px",
              maxWidth: "280px",
            }}
          >
            Start with clarity →
          </button>

          <div>
            <p style={{ fontSize: "0.83rem", color: "#888", margin: "0 0 0.2rem" }}>or</p>
            <p style={{ fontSize: "0.83rem", margin: 0 }}>
              Already using SANE?{" "}
              <Link to="/login" style={{ color: "#E8640A", fontWeight: 600 }}>
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div
          className="hero-illustration"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <SANEIllustrationDesktop />
        </div>
      </div>

      {/* ----- The S.A.N.E. approach ----- */}
      <div
        id="landing-approach"
        style={{
          background: "#fff",
          padding: "5rem 4rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.9rem",
            color: "#1a1a1a",
            marginBottom: "0.5rem",
          }}
        >
          The S.A.N.E. approach
        </h2>
        <p
          style={{
            color: "#888",
            fontSize: "0.95rem",
            marginBottom: "3rem",
            maxWidth: "500px",
            margin: "0 auto 3rem",
            lineHeight: 1.5,
          }}
        >
          A simple system to help you stop doing needless work and start making real
          progress.
        </p>

        <div
          className="approach-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e8e8e8",
              padding: "2rem 1.5rem",
              textAlign: "left",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#F3F0FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                marginBottom: "1rem",
              }}
            >
              👁️
            </div>
            <h4
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1a1a1a",
                marginBottom: "0.5rem",
              }}
            >
              See what matters
            </h4>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#888",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Get clarity on your priorities and focus on high-impact work.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e8e8e8",
              padding: "2rem 1.5rem",
              textAlign: "left",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#FEF3EA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                marginBottom: "1rem",
              }}
            >
              🔕
            </div>
            <h4
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1a1a1a",
                marginBottom: "0.5rem",
              }}
            >
              Ignore the noise
            </h4>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#888",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Eliminate distractions, busywork, and everything that doesn&apos;t move
              the needle.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e8e8e8",
              padding: "2rem 1.5rem",
              textAlign: "left",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#F0FDF4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                marginBottom: "1rem",
              }}
            >
              ✓
            </div>
            <h4
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1a1a1a",
                marginBottom: "0.5rem",
              }}
            >
              Finish what you start
            </h4>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#888",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Build momentum, follow through, and ship meaningful results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
