// frontend_web/src/__tests__/App.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../components/ProtectedRoute", async () => {
  const { Outlet } = await import("react-router-dom");
  return { default: () => <Outlet /> };
});

vi.mock("../components/HomeRedirect", () => ({
  default: () => <div data-testid="home-redirect" />,
}));

vi.mock("../views/Login", () => ({ default: () => <div data-testid="vista-Login" /> }));
vi.mock("../views/LandingPage", () => ({ default: () => <div data-testid="vista-LandingPage" /> }));
vi.mock("../views/RecuperarPassword", () => ({ default: () => <div data-testid="vista-RecuperarPassword" /> }));
vi.mock("../views/ResetPassword", () => ({ default: () => <div data-testid="vista-ResetPassword" /> }));
vi.mock("../views/AdminDashboard", () => ({ default: () => <div data-testid="vista-AdminDashboard" /> }));
vi.mock("../views/AfiliadosView", () => ({ default: () => <div data-testid="vista-AfiliadosView" /> }));
vi.mock("../views/GestionPersonal", () => ({ default: () => <div data-testid="vista-GestionPersonal" /> }));
vi.mock("../views/RutinasView", () => ({ default: () => <div data-testid="vista-RutinasView" /> }));
vi.mock("../views/DietasView", () => ({ default: () => <div data-testid="vista-DietasView" /> }));
vi.mock("../views/RestriccionesAdmin", () => ({ default: () => <div data-testid="vista-RestriccionesAdmin" /> }));
vi.mock("../views/ProgresoAfiliado", () => ({ default: () => <div data-testid="vista-ProgresoAfiliado" /> }));
vi.mock("../views/PagosView", () => ({ default: () => <div data-testid="vista-PagosView" /> }));
vi.mock("../views/FinanzasView", () => ({ default: () => <div data-testid="vista-FinanzasView" /> }));

import App from "../App";

function renderApp(hash) {
  window.location.hash = hash;
  return render(<App />);
}

describe("App", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  test("ruta raíz pública renderiza la landing", async () => {
    renderApp("#/");
    expect(await screen.findByTestId("vista-LandingPage")).toBeInTheDocument();
  });

  test("ruta /login renderiza Login", async () => {
    renderApp("#/login");
    expect(await screen.findByTestId("vista-Login")).toBeInTheDocument();
  });

  test("ruta protegida de admin renderiza AdminDashboard", async () => {
    renderApp("#/dashboard");
    expect(await screen.findByTestId("vista-AdminDashboard")).toBeInTheDocument();
  });

  test("ruta protegida compartida renderiza Pagos", async () => {
    renderApp("#/pagos");
    expect(await screen.findByTestId("vista-PagosView")).toBeInTheDocument();
  });

  test("ruta /home renderiza HomeRedirect", async () => {
    renderApp("#/home");
    expect(await screen.findByTestId("home-redirect")).toBeInTheDocument();
  });

  test("ruta de reset con parámetro renderiza ResetPassword", async () => {
    renderApp("#/reset-password/abc123");
    expect(await screen.findByTestId("vista-ResetPassword")).toBeInTheDocument();
  });

  test("ruta desconocida redirige a login", async () => {
    renderApp("#/ruta-que-no-existe");
    expect(await screen.findByTestId("vista-Login")).toBeInTheDocument();
  });
});
