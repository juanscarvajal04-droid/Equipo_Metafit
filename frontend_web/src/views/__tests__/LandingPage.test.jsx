// frontend_web/src/views/__tests__/LandingPage.test.jsx
// Smoke test de la página pública: navegación, secciones y modal de términos.
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import LandingPage from "../LandingPage";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));

function renderView() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    Element.prototype.scrollIntoView = vi.fn();
  });

  test("renderiza hero, secciones, enlaces y términos y condiciones", () => {
    renderView();

    expect(screen.getByText(/Toma el Control/)).toBeInTheDocument();
    expect(screen.getByText("Afiliados activos")).toBeInTheDocument();
    expect(screen.getByText("Rutinas Inteligentes")).toBeInTheDocument();
    expect(screen.getByText("Dieta de Precisión")).toBeInTheDocument();
    expect(screen.getByText("Control Total")).toBeInTheDocument();
    expect(screen.getByText("Entrena en el")).toBeInTheDocument();
    expect(screen.getByText(/Sobre MetaFit/)).toBeInTheDocument();
    expect(screen.getByText(/Listo para transformar/)).toBeInTheDocument();
    expect(screen.getByText(/Lleva MetaFit en/)).toBeInTheDocument();
    expect(screen.getByText(/Descargar APK/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Conoce Más/));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Funciones"));
    fireEvent.click(screen.getAllByText("Sobre Nosotros")[0]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByText(/Términos y Condiciones/));
    expect(
      screen.getByRole("heading", { name: /Términos y Condiciones/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Privacidad de Datos/)).toBeInTheDocument();
    expect(screen.getByText(/admin@metafit.com/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Entendido/));
    expect(
      screen.queryByRole("heading", { name: /Términos y Condiciones/ })
    ).not.toBeInTheDocument();
  });

  test("redirige al panel correspondiente si hay sesión", () => {
    useAuth.mockReturnValue({ user: { role: "Entrenador" } });
    renderView();
    expect(screen.getByText(/Toma el Control/)).toBeInTheDocument();
  });
});
