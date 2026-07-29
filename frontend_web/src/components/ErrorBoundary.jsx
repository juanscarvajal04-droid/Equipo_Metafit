// frontend_web/src/components/ErrorBoundary.jsx
// Captura errores de renderizado para evitar pantallas blancas.
// En desarrollo muestra el mensaje y el stack; en producción solo muestra
// un mensaje genérico amigable con botón para recargar.
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error capturado:", error, info);
    this.setState({ info });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, info: null });
    window.location.reload();
  };

  render() {
    const { hasError, error, info } = this.state;
    const isDev = import.meta.env.DEV;

    if (!hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0f0f1a,#1a1a2e)",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(233,69,96,0.35)",
            borderRadius: 16,
            padding: "40px 32px",
            maxWidth: 680,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(233,69,96,0.12)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>💥</div>
          <h1
            style={{
              color: "#e94560",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Algo salió mal
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 24, fontSize: "0.88rem" }}>
            Ocurrió un error inesperado en la aplicación. Puedes intentar recargar la página.
          </p>

          {isDev && error && (
            <details
              style={{
                textAlign: "left",
                background: "rgba(0,0,0,0.35)",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 24,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <summary
                style={{
                  color: "#f59e0b",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  marginBottom: 8,
                }}
              >
                🔍 Detalles del error (solo en desarrollo)
              </summary>
              <pre
                style={{
                  color: "#fca5a5",
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  marginTop: 8,
                }}
              >
                {error?.toString()}
              </pre>
              {info?.componentStack && (
                <pre
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "0.68rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    marginTop: 8,
                    marginBottom: 0,
                  }}
                >
                  {info.componentStack}
                </pre>
              )}
            </details>
          )}

          <button
            onClick={this.handleReload}
            style={{
              background: "linear-gradient(135deg,#e94560,#c62a47)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 28px",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            🔄 Recargar página
          </button>
        </div>
      </div>
    );
  }
}
