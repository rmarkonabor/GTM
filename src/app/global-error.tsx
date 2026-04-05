"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ maxWidth: 480, padding: "2rem" }}>
          <h2 style={{ color: "#fca5a5", marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {error.message || "A server error occurred."}
          </p>
          {error.digest && (
            <p style={{ color: "#ef4444", fontSize: "0.75rem", fontFamily: "monospace", marginBottom: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: "#7c3aed", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
