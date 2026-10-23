// frontend_web/src/components/__tests__/Sidebar.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "../../context/AuthContext";
import Sidebar from "../Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Administrador: links operativos + sección de administración y logout", () => {
    useAuth.mockReturnValue({ user: { role: "Administrador", email: "admin@metafit.com" }, logout });
    renderSidebar();

    expect(screen.getByText("admin@metafit.com")).toBeInTheDocument();
    expect(screen.getByText(/Administrador/)).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Afiliados")).toBeInTheDocument();
    expect(screen.getByText("Rutinas")).toBeInTheDocument();
    expect(screen.getByText("Dietas")).toBeInTheDocument();
    expect(screen.getByText("Restricciones")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Personal")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cerrar sesión/));
    expect(logout).toHaveBeenCalled();
  });

  test("Recepcionista: links propios sin administración", () => {
    useAuth.mockReturnValue({ user: { role: "Recepcionista", email: "recepcion@metafit.com" }, logout });
    renderSidebar();

    expect(screen.getByText("Gestión de Afiliados")).toBeInTheDocument();
    expect(screen.getByText("Pagos")).toBeInTheDocument();
    expect(screen.queryByText("Gestión de Personal")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  test("Entrenador: planes, dietas y afiliados en modo ver", () => {
    useAuth.mockReturnValue({ user: { role: "Entrenador", email: "entrenador@metafit.com" }, logout });
    renderSidebar();

    expect(screen.getByText("Planes de Entreno")).toBeInTheDocument();
    expect(screen.getByText("Afiliados (Ver)")).toBeInTheDocument();
    expect(screen.queryByText("Finanzas")).not.toBeInTheDocument();
  });

  test("sin usuario cae en defaults seguros", () => {
    useAuth.mockReturnValue({ user: null, logout });
    renderSidebar();

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Afiliados")).toBeInTheDocument();
  });
});
