import { useNavigate, Link } from "react-router-dom";

function SANEIllustration() {
  return (
    <div className="landing-illustration">
      <div className="landing-illustration__stack">
        {[
          { top: "0px", left: "2px", rotate: "-8deg" },
          { top: "20px", left: "14px", rotate: "3deg" },
          { top: "40px", left: "4px", rotate: "-2deg" },
        ].map((s, i) => (
          <div
            key={i}
            className="landing-illustration__card"
            style={{
              top: s.top,
              left: s.left,
              transform: `rotate(${s.rotate})`,
            }}
          >
            <div className="landing-illustration__card-bar landing-illustration__card-bar--wide" />
            <div className="landing-illustration__card-bar landing-illustration__card-bar--narrow" />
          </div>
        ))}
      </div>

      <div className="landing-illustration__arrow" aria-hidden>
        →
      </div>

      <div className="landing-illustration__list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="landing-illustration__row">
            <div className="landing-illustration__check">✓</div>
            <div className="landing-illustration__line" />
            <div className="landing-illustration__square" />
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
    <div className="landing-page-root">
      <div className="landing-page-grid">
        <header className="landing-brand">
          <h1>S.A.N.E</h1>
          <p className="landing-tagline">Stop All Needless Effort</p>
        </header>

        <div className="landing-hero">
          <h2>
            Work shouldn&apos;t
            <br />
            feel chaotic.
          </h2>
          <p className="landing-sub">Let&apos;s fix that.</p>
        </div>

        <div className="landing-visual">
          <SANEIllustration />
        </div>

        <div className="landing-pillars">
          {pillars.map((f, i) => (
            <div key={i} className="landing-pillar">
              <div className="landing-pillar-icon">{f.icon}</div>
              <p>
                {f.line1}
                <br />
                {f.line2}
              </p>
            </div>
          ))}
        </div>

        <div className="landing-cta">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/signup")}
          >
            Start with clarity <span style={{ fontSize: "1.1rem" }}>→</span>
          </button>
          <p className="landing-login-hint">
            <span className="text-muted">or</span>
            <br />
            Already using SANE?{" "}
            <Link to="/login" className="landing-login-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
