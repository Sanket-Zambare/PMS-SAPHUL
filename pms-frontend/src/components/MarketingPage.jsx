import Navbar from "./Navbar";

/**
 * Shared shell for public marketing pages: fixed Navbar + hero + optional children.
 */
function MarketingPage({ title, description, children }) {
  return (
    <div
      className="marketing-page-root"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        background: "#F5F4F0",
      }}
    >
      <Navbar />
      <main
        style={{
          paddingTop: "80px",
          paddingLeft: "clamp(1.25rem, 4vw, 3rem)",
          paddingRight: "clamp(1.25rem, 4vw, 3rem)",
          paddingBottom: "4rem",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: children ? "2.5rem" : 0 }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.85rem, 4vw, 2.5rem)",
              color: "#1a1a1a",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "#555",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              margin: 0,
              maxWidth: "640px",
            }}
          >
            {description}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}

export default MarketingPage;
