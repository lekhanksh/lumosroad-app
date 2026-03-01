import React from "react";

/*
 * Clean phone frame — no overlapping notch.
 * Uses a status-bar spacer + Dynamic Island pill that sit ABOVE the app
 * content (in normal flow), so nothing is hidden.
 */

const S: Record<string, React.CSSProperties> = {
  page: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
  },
  header: { textAlign: "center" as const },
  title: { fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: 0.5, margin: 0 },
  accent: { color: "#818CF8" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#94A3B8" },

  /* outer bezel */
  bezel: {
    width: 390,
    height: 844,
    borderRadius: 50,
    border: "6px solid #3E4456",
    background: "#1A1A2E",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow:
      "0 0 0 2px #0F172A, 0 30px 80px rgba(0,0,0,0.65), 0 0 50px rgba(99,102,241,0.12)",
  },

  /* status bar area — sits in normal flow, never overlaps content */
  statusBar: {
    height: 54,
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /* Dynamic Island pill */
  island: {
    width: 120,
    height: 28,
    borderRadius: 14,
    background: "#1E293B",
  },

  /* app content fills the rest */
  appContainer: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    background: "#F8FAFC",
  },

  /* home indicator at the bottom — also in normal flow */
  homeBarWrap: {
    height: 28,
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  homeBar: {
    width: 130,
    height: 5,
    borderRadius: 3,
    background: "#CBD5E1",
  },

  footer: { textAlign: "center" as const },
  footerText: { fontSize: 12, color: "#475569", margin: 0 },
};

type Props = { children: React.ReactNode };

export const PhoneFrameWrapper: React.FC<Props> = ({ children }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 500);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) return <>{children}</>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>
          Lumos<span style={S.accent}>Road</span>
        </h1>
        <p style={S.subtitle}>Safety-First Navigation for Pune</p>
      </div>

      <div style={S.bezel}>
        {/* Status bar with Dynamic Island — in normal flow, not absolute */}
        <div style={S.statusBar}>
          <div style={S.island} />
        </div>

        {/* App content */}
        <div style={S.appContainer}>{children}</div>

        {/* Home indicator */}
        <div style={S.homeBarWrap}>
          <div style={S.homeBar} />
        </div>
      </div>

      <div style={S.footer}>
        <p style={S.footerText}>Built with Expo, React Native & AWS</p>
      </div>
    </div>
  );
};
