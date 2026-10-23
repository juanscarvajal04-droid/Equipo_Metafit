import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import ProtectedRoute from "../ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

function renderRoute(allowedRoles, initial = "/") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/" element={<div>contenido protegido</div>} />
        </Route>
        <Route path="/login" element={<div>login</div>} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
        <Route path="/afiliados" element={<div>afiliados</div>} />
        <Route path="/rutinas" element={<div>rutinas</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  useAuth.mockReset();
});

describe("ProtectedRoute", () => {
  test("muestra el spinner mientras se resuelve la autenticación", () => {
    useAuth.mockReturnValue({ token: null, user: null, isAuthReady: false });
    const { container } = renderRoute();
    expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
    expect(container.querySelector('[style*="spin"]')).toBeInTheDocument();
  });

  test("redirige a login sin token o sin usuario", () => {
    useAuth.mockReturnValue({ token: null, user: null, isAuthReady: true });
    renderRoute();
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  test("recupera usuario desde localStorage cuando el contexto aún no propaga", () => {
    useAuth.mockReturnValue({ token: "jwt", user: null, isAuthReady: true });
    localStorage.setItem("metafit_user", JSON.stringify({ role: "Entrenador" }));
    renderRoute(["Entrenador"]);
    expect(screen.getByText("contenido protegido")).toBeInTheDocument();
  });

  test("ignora JSON corrupto o sin rol en localStorage", () => {
    useAuth.mockReturnValue({ token: "jwt", user: null, isAuthReady: true });

    localStorage.setItem("metafit_user", "{corrupto");
    const { unmount } = renderRoute(["Entrenador"]);
    expect(screen.getByText("login")).toBeInTheDocument();
    unmount();

    localStorage.setItem("metafit_user", JSON.stringify({ nombres: "Sin rol" }));
    renderRoute(["Entrenador"]);
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  test("redirige al home del rol cuando no tiene permiso", () => {
    useAuth.mockReturnValue({
      token: "jwt",
      user: { role: "Entrenador" },
      isAuthReady: true,
    });
    renderRoute(["Administrador"]);
    expect(screen.getByText("rutinas")).toBeInTheDocument();
  });

  test("usa /login como fallback para roles desconocidos", () => {
    useAuth.mockReturnValue({
      token: "jwt",
      user: { role: "Invitado" },
      isAuthReady: true,
    });
    renderRoute(["Administrador"]);
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  test("renderiza el outlet cuando el rol está permitido", () => {
    useAuth.mockReturnValue({
      token: "jwt",
      user: { role: "Recepcionista" },
      isAuthReady: true,
    });
    renderRoute(["Recepcionista"]);
    expect(screen.getByText("contenido protegido")).toBeInTheDocument();
  });
});
