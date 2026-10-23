// frontend_web/src/components/__tests__/Footer.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import Footer from "../Footer";

describe("Footer", () => {
  test("renderiza copyright, términos e Instagram", () => {
    render(<Footer />);
    expect(screen.getByText(/MetaFit/)).toBeInTheDocument();
    expect(screen.getByText("📋 Términos y Condiciones")).toBeInTheDocument();
    expect(screen.getByText("@sportgymsede80")).toBeInTheDocument();
  });

  test("abre el modal de términos y lo cierra con el botón Entendido", () => {
    render(<Footer />);
    expect(screen.queryByText("📋 Términos y Condiciones", { selector: "h5" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    expect(screen.getByText("📋 Términos y Condiciones", { selector: "h5" })).toBeInTheDocument();
    expect(screen.getByText(/Privacidad de Datos/)).toBeInTheDocument();
    expect(screen.getByText(/admin@metafit.com/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Entendido ✓"));
    expect(screen.queryByText("📋 Términos y Condiciones", { selector: "h5" })).not.toBeInTheDocument();
  });

  test("cierra con overlay y con teclado Escape/Enter", () => {
    render(<Footer />);
    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar términos y condiciones" }));
    expect(screen.queryByText("📋 Términos y Condiciones", { selector: "h5" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar términos y condiciones" }), { key: "Escape" });
    expect(screen.queryByText("📋 Términos y Condiciones", { selector: "h5" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("📋 Términos y Condiciones"));
    fireEvent.click(screen.getByText("✕"));
    expect(screen.queryByText("📋 Términos y Condiciones", { selector: "h5" })).not.toBeInTheDocument();
  });
});
