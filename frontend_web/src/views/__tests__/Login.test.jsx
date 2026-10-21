// frontend_web/src/views/__tests__/Login.test.jsx
// Smoke test del login: render diferido, roles, mostrar contraseña y errores.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Login from "../Login";
import { useAuth } from "../../context/AuthContext";
import { persistUserRole } from "../../services/authService";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../components/PublicLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../services/authService", () => ({ persistUserRole: vi.fn() }));

function renderView() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

async function completarFormulario() {
  const correo = await screen.findByPlaceholderText(
    "Ingresa tu correo electrónico",
    {},
    { timeout: 2500 }
  );
  fireEvent.change(correo, { target: { value: "admin@metafit.com" } });
  fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
    target: { value: "secreto123" },
  });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Recepcionista" },
  });
  fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
  return correo;
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: vi.fn().mockResolvedValue({ role: "Recepcionista", id: 1 }),
      logout: vi.fn(),
    });
  });

  test("inicia sesión y persiste el rol", async () => {
    renderView();
    await completarFormulario();
    fireEvent.click(screen.getByText(/Ingresar al Sistema/));

    await waitFor(() =>
      expect(useAuth().login).toHaveBeenCalledWith({
        correo: "admin@metafit.com",
        contrasena: "secreto123",
      })
    );
    expect(persistUserRole).toHaveBeenCalledWith("Recepcionista");
  });

  test("muestra credenciales incorrectas y bloquea afiliados", async () => {
    const login = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ role: "Afiliado" });
    useAuth.mockReturnValue({ login, logout: vi.fn() });

    renderView();
    await completarFormulario();
    fireEvent.click(screen.getByText(/Ingresar al Sistema/));
    expect(
      await screen.findByText(/Correo o contraseña incorrectos/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Ingresar al Sistema/));
    expect(
      await screen.findByText(/solo para personal administrativo/)
    ).toBeInTheDocument();
  });
});
