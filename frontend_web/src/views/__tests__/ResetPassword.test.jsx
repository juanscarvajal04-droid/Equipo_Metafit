// frontend_web/src/views/__tests__/ResetPassword.test.jsx
// Smoke test del restablecimiento: validaciones, éxito y error del servicio.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import ResetPassword from "../ResetPassword";
import { resetPasswordRequest } from "../../services/authService";

vi.mock("../../components/PublicLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../services/authService", () => ({
  resetPasswordRequest: vi.fn(),
}));

function renderView() {
  return render(
    <MemoryRouter initialEntries={["/reset-password/token-123"]}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );
}

function completar(pass, confirm) {
  fireEvent.change(screen.getByPlaceholderText("Nueva contraseña"), {
    target: { value: pass },
  });
  fireEvent.change(screen.getByPlaceholderText("Repetí la nueva contraseña"), {
    target: { value: confirm },
  });
  fireEvent.click(screen.getByText("Guardar nueva contraseña"));
}

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordRequest.mockResolvedValue({ message: "ok" });
  });

  test("valida longitud, coincidencia y actualiza la contraseña", async () => {
    renderView();

    completar("123", "123");
    expect(
      await screen.findByText(/al menos 6 caracteres/)
    ).toBeInTheDocument();

    completar("secreto123", "otro123");
    expect(await screen.findByText(/no coinciden/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
    completar("secreto123", "secreto123");
    await waitFor(() =>
      expect(resetPasswordRequest).toHaveBeenCalledWith("token-123", "secreto123")
    );
    expect(
      await screen.findByText(/fue actualizada correctamente/)
    ).toBeInTheDocument();
  });

  test("muestra el error devuelto por el backend", async () => {
    resetPasswordRequest.mockRejectedValueOnce({
      response: { data: { error: "Token inválido o expirado" } },
    });
    renderView();
    completar("secreto123", "secreto123");
    expect(
      await screen.findByText(/Token inválido o expirado/)
    ).toBeInTheDocument();
  });
});
