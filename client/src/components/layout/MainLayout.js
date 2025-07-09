// client/src/components/layout/MainLayout.js
import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket"; // ← NUEVA IMPORTACIÓN

function MainLayout({ children }) {
  // Inicializar conexión Socket.io para toda la aplicación
  const { connected } = useSocket();

  // Log del estado de conexión para debug
  useEffect(() => {
    if (connected) {
      console.log(
        "🟢 MainLayout: Socket conectado - Notificaciones en tiempo real activas"
      );
    } else {
      console.log("🔴 MainLayout: Socket desconectado");
    }
  }, [connected]);

  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <main
          style={{
            marginLeft: "260px",
            marginTop: "70px",
            padding: "20px",
            width: "calc(100% - 260px)",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          {/* Indicador de estado de conexión (opcional, para debug) */}
          {process.env.NODE_ENV === "development" && (
            <div
              className="position-fixed bottom-0 start-0 p-2"
              style={{ zIndex: 1000 }}
            >
              <span
                className={`badge ${
                  connected ? "bg-success" : "bg-danger"
                } small`}
              >
                <i
                  className={`bi ${connected ? "bi-wifi" : "bi-wifi-off"} me-1`}
                ></i>
                {connected ? "En tiempo real" : "Desconectado"}
              </span>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
