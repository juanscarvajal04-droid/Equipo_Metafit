// frontend_web/src/components/__tests__/RoleSwitch.test.jsx
// Hallazgo #5: cambio rápido de rol sin cerrar sesión.
// Integra Header + AuthProvider + ProtectedRoute para verificar que la sesión
// anterior se reemplaza y que las rutas exclusivas del rol anterior desaparecen.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Header from "../Header";
import ProtectedRoute from "../ProtectedRoute";
import { AuthProvider } from "../../context/AuthContext";
import { loginUser } from "../../services/authService";

vi.mock("../../services/api", () => ({
  API_BASE_URL: "http://api.test",
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
  },
}));

vi.mock("../../services/authService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, loginUser: vi.fn() };
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="ruta-actual">{location.pathname}</div>;
}

function AppProbe() {
  return (
    <MemoryRouter initialEntries={["/pagos"]}>
      <Header />
      <LocationProbe />
      <Routes>
        <Route
          element={<ProtectedRoute allowedRoles={["Administrador", "Recepcionista"]} />}
        >
          <Route path="/pagos" element={<div>Vista de Pagos</div>} />
        </Route>
        <Route
          element={<ProtectedRoute allowedRoles={["Administrador", "Entrenador"]} />}
        >
          <Route path="/rutinas" element={<div>Vista de Rutinas</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("Cambio rápido de rol", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    localStorage.setItem("metafit_token", "jwt-admin-anterior");
    localStorage.setItem(
      "metafit_user",
      JSON.stringify({ id: 1, email: "carlos@metafit.com", role: "Administrador", nombres: "Carlos" })
    );
    localStorage.setItem("metafit_role", "Administrador");
  });

  test("abre el menú, pide credenciales y reemplaza token/usuario/ruta", async () => {
    loginUser.mockResolvedValueOnce({
      accessToken: "jwt-entrenador-nuevo",
      user: { id: 2, email: "laura@metafit.com", role: "Entrenador", nombres: "Laura" },
    });

    render(
      <AuthProvider>
        <AppProbe />
      </AuthProvider>
    );

    expect(await screen.findByText("Vista de Pagos")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Cambiar rol \(actual: Administrador\)/i })
    );
    expect(screen.getByRole("menu", { name: "Cambiar rol" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar a Entrenador/i }));

    const modal = screen.getByRole("dialog", { name: "Cambiar a Entrenador" });
    expect(modal).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Correo del nuevo rol"), {
      target: { value: "laura@metafit.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña del nuevo rol"), {
      target: { value: "Laura123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));

    await waitFor(() =>
      expect(loginUser).toHaveBeenCalledWith({
        correo: "laura@metafit.com",
        contrasena: "Laura123!",
      })
    );

    await waitFor(() => {
      expect(localStorage.getItem("metafit_token")).toBe("jwt-entrenador-nuevo");
      expect(localStorage.getItem("metafit_role")).toBe("Entrenador");
      expect(localStorage.getItem("metafit_user")).toContain("Entrenador");
      expect(localStorage.getItem("metafit_user")).not.toContain("Administrador");
    });

    expect(await screen.findByText("Vista de Rutinas")).toBeInTheDocument();
    expect(screen.queryByText("Vista de Pagos")).not.toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/rutinas");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
