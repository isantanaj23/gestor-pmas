// client/src/components/layout/Navbar.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../common/NotificationCenter"; // ← NUEVA IMPORTACIÓN

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error en logout:", error);
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Cerrar menú al hacer click fuera
  const handleClickOutside = (e) => {
    if (!e.target.closest(".dropdown")) {
      setIsUserMenuOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container-fluid">
        {/* Logo */}
        <a className="navbar-brand fw-bold text-primary" href="/">
          <i className="bi bi-kanban me-2"></i>
          Planifica+
        </a>

        {/* Barra de búsqueda central */}
        <div className="d-none d-md-flex flex-grow-1 mx-4">
          <div
            className="input-group"
            style={{ maxWidth: "400px", margin: "0 auto" }}
          >
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 bg-light"
              placeholder="Buscar proyectos, tareas, contactos..."
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>

        {/* Usuario y notificaciones */}
        <div className="d-flex align-items-center gap-3">
          {/* Notificaciones en tiempo real - REEMPLAZA EL BOTÓN ESTÁTICO */}
          <NotificationCenter />

          {/* Menú de usuario */}
          <div className="dropdown">
            <button
              className="btn d-flex align-items-center gap-2 border-0 bg-transparent"
              onClick={toggleUserMenu}
              aria-expanded={isUserMenuOpen}
            >
              {/* Avatar del usuario */}
              <div className="position-relative">
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "Usuario"
                    )}&background=6f42c1&color=fff&size=40`
                  }
                  alt="Avatar"
                  className="rounded-circle"
                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                />
                <span
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                  style={{ width: "12px", height: "12px" }}
                  title="En línea"
                ></span>
              </div>

              {/* Información del usuario */}
              <div className="d-none d-lg-block text-start">
                <div
                  className="fw-semibold text-dark"
                  style={{ fontSize: "0.9rem" }}
                >
                  {user?.name || "Usuario"}
                </div>
                <div className="text-muted small">
                  {user?.role || "Sin rol"}
                </div>
              </div>

              <i
                className={`bi ${
                  isUserMenuOpen ? "bi-chevron-up" : "bi-chevron-down"
                } text-muted`}
              ></i>
            </button>

            {/* Menú desplegable */}
            {isUserMenuOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show shadow"
                style={{ minWidth: "250px" }}
              >
                {/* Header del menú */}
                <div className="dropdown-header">
                  <div className="d-flex align-items-center">
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.name || "Usuario"
                        )}&background=6f42c1&color=fff&size=50`
                      }
                      alt="Avatar"
                      className="rounded-circle me-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <div className="fw-bold">{user?.name || "Usuario"}</div>
                      <div className="text-muted small">
                        {user?.email || "Sin email"}
                      </div>
                      <span
                        className={`badge badge-sm mt-1 ${
                          user?.role === "admin"
                            ? "bg-danger"
                            : user?.role === "manager"
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                      >
                        {user?.role || "Sin rol"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                {/* Opciones del menú */}
                <a className="dropdown-item" href="/profile">
                  <i className="bi bi-person me-2"></i>
                  Mi Perfil
                </a>

                <a className="dropdown-item" href="/settings">
                  <i className="bi bi-gear me-2"></i>
                  Configuración
                </a>

                <a className="dropdown-item" href="/help">
                  <i className="bi bi-question-circle me-2"></i>
                  Ayuda
                </a>

                {/* Opciones de admin */}
                {(user?.role === "admin" || user?.role === "manager") && (
                  <>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item" href="/admin">
                      <i className="bi bi-shield-lock me-2"></i>
                      Panel Admin
                    </a>
                  </>
                )}

                <div className="dropdown-divider"></div>

                {/* Logout */}
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botón de menú móvil */}
        <button
          className="navbar-toggler d-lg-none ms-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
