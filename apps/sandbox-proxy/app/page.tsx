import { getAllowedOrigin } from "@/lib/origins";

export const metadata = {
  title: "Sandbox Preview Proxy",
};

export default function Page() {
  const webOrigin = getAllowedOrigin();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fafafa",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
      }}
    >
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: "24px 32px",
          maxWidth: 480,
        }}
      >
        <h1 style={{ fontSize: 16, margin: "0 0 8px" }}>Sandbox Preview Proxy</h1>
        <p style={{ margin: "0 0 16px", color: "#555", fontSize: 13 }}>
          This origin serves previews for generated apps in an isolated context, separate from the
          web application.
        </p>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "6px 16px",
            fontSize: 13,
            margin: 0,
          }}
        >
          <dt style={{ color: "#999" }}>status</dt>
          <dd style={{ margin: 0, color: "#0a7d33" }}>online</dd>
          <dt style={{ color: "#999" }}>allowed origin</dt>
          <dd style={{ margin: 0 }}>{webOrigin}</dd>
        </dl>
      </section>
    </main>
  );
}
