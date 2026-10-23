// frontend_web/src/components/__tests__/PublicLayout.test.jsx
// Cubre navbar con scroll, modal de términos y cierre por overlay/teclado/botón.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import PublicLayout from "../PublicLayout";

function renderLayout() {
  return render(
    <MemoryRouter>
      <PublicLayout>
        <p>Contenido público</p>
      </PublicLayout>
    </MemoryRouter>
  );
}

describe("PublicLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("renderiza el contenido y reacciona al scroll", () => {
    renderLayout();
    expect(screen.getByText("Contenido público")).toBeInTheDocument();

    window.scrollY = 100;
    fireEvent.scroll(window);
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(screen.getAllByText("MetaFit").length).toBeGreaterThan(0);
  });

  test("abre y cierra los términos por teclado, overlay y botón", async () => {
    renderLayout();

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    expect(
      await screen.findByRole("heading", { name: /Términos y Condiciones/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Privacidad de Datos/)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("Cerrar términos y condiciones"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(screen.queryByText(/Privacidad de Datos/)).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    await screen.findByText(/Privacidad de Datos/);
    fireEvent.click(screen.getByLabelText("Cerrar términos y condiciones"));
    await waitFor(() =>
      expect(screen.queryByText(/Privacidad de Datos/)).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    await screen.findByText(/Privacidad de Datos/);
    fireEvent.click(screen.getByText("Entendido ✓"));
    await waitFor(() =>
      expect(screen.queryByText(/Privacidad de Datos/)).not.toBeInTheDocument()
    );
  });
});
