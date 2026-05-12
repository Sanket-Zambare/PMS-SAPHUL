import { Link, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Home", to: "/welcome" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "About SANE", to: "/about" },
  { label: "Resources", to: "/resources" },
  { label: "Pricing", to: "/pricing" },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const linkActive = (to) => location.pathname === to;

  return (
    <nav
      className="landing-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <Link
        to="/welcome"
        style={{
          textDecoration: "none",
          color: "inherit",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: "1.4rem",
            letterSpacing: "0.15em",
            color: "#1a1a1a",
            lineHeight: 1,
          }}
        >
          S.A.N.E
        </div>
        <div
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.12em",
            color: "#888",
            textTransform: "uppercase",
          }}
        >
          Stop All Needless Effort
        </div>
      </Link>

      <div
        className="nav-links-desktop"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          flex: 1,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = linkActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                fontSize: "0.9rem",
                color: active ? "#E8640A" : "#555",
                textDecoration: "none",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "2px solid #E8640A" : "none",
                paddingBottom: "2px",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            fontSize: "0.9rem",
            color: "#555",
            textDecoration: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            font: "inherit",
          }}
        >
          Log in
        </button>
      </div>

      <button
        type="button"
        className="btn btn-primary landing-nav-cta"
        onClick={() => navigate("/signup")}
        style={{
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "0.9rem",
          padding: "0.6rem 1.25rem",
          flexShrink: 0,
        }}
      >
        Start with clarity →
      </button>
    </nav>
  );
}

export default Navbar;
