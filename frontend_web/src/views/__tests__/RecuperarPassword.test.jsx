import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import RecuperarPassword from "../RecuperarPassword";

vi.mock("../../services/authService", () => ({
  solicitarRecuperacion: vi.fn(),
  resetPasswordRequest: vi.fn(),
}));

import { solicitarRecuperacion } from "../../services/authService";

function renderView() {
  return render(
    <MemoryRouter initialEntries={["/recuperar-password"]}>
      <RecuperarPassword />
    </MemoryRouter>
  );
}

describe("RecuperarPassword (web)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renderiza el formulario con el campo de correo y sus acciones", () => {
    const { getByPlaceholderText, getByText } = renderView();

    expect(getByPlaceholderText("Ingresa tu correo electrónico")).toBeInTheDocument();
    expect(getByText("Enviar enlace de recuperación")).toBeInTheDocument();
    expect(getByText("← Volver a Iniciar Sesión")).toBeInTheDocument();
  });

  test("muestra el mensaje de éxito al enviar un correo válido", async () => {
    solicitarRecuperacion.mockResolvedValue({ mensaje: "ok" });
    const { getByPlaceholderText, getByText, findByText } = renderView();

    fireEvent.change(getByPlaceholderText("Ingresa tu correo electrónico"), {
      target: { value: "carlos@metafit.com" },
    });
    fireEvent.click(getByText("Enviar enlace de recuperación"));

    expect(await findByText(/recibirás un enlace para restablecer/i)).toBeInTheDocument();
    expect(solicitarRecuperacion).toHaveBeenCalledWith("carlos@metafit.com");
  });

  test("muestra el token en modo prueba cuando el backend lo devuelve", async () => {
    solicitarRecuperacion.mockResolvedValue({ modoPrueba: true, token: "jwt-falso" });
    const { getByPlaceholderText, getByText, findByText } = renderView();

    fireEvent.change(getByPlaceholderText("Ingresa tu correo electrónico"), {
      target: { value: "carlos@metafit.com" },
    });
    fireEvent.click(getByText("Enviar enlace de recuperación"));

    expect(await findByText(/Modo prueba/)).toBeInTheDocument();
    expect(screen.getByText("jwt-falso")).toBeInTheDocument();
  });

  test("muestra un mensaje de error si el backend falla", async () => {
    solicitarRecuperacion.mockRejectedValue({ response: { status: 500 } });
    const { getByPlaceholderText, getByText, findByText } = renderView();

    fireEvent.change(getByPlaceholderText("Ingresa tu correo electrónico"), {
      target: { value: "carlos@metafit.com" },
    });
    fireEvent.click(getByText("Enviar enlace de recuperación"));

    expect(await findByText(/Error de conexión/i)).toBeInTheDocument();
  });
});