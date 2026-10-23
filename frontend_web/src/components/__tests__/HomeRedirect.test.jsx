// frontend_web/src/components/__tests__/HomeRedirect.test.jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "../../context/AuthContext";
import HomeRedirect from "../HomeRedirect";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<div>destino dashboard</div>} />
        <Route path="/afiliados" element={<div>destino afiliados</div>} />
        <Route path="/rutinas" element={<div>destino rutinas</div>} />
        <Route path="/login" element={<div>destino login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("HomeRedirect", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("redirige según el rol del contexto", () => {
    useAuth.mockReturnValue({ user: { role: "Administrador" } });
    renderHome();
    expect(screen.getByText("destino dashboard")).toBeInTheDocument();
  });

  test("usa localStorage como fallback", () => {
    useAuth.mockReturnValue({ user: null });
    localStorage.setItem("metafit_user", JSON.stringify({ role: "Entrenador" }));
    renderHome();
    expect(screen.getByText("destino rutinas")).toBeInTheDocument();
  });

  test("JSON inválido en localStorage cae a login", () => {
    useAuth.mockReturnValue({ user: null });
    localStorage.setItem("metafit_user", "{no-json");
    renderHome();
    expect(screen.getByText("destino login")).toBeInTheDocument();
  });

  test("sin usuario ni storage cae a login", () => {
    useAuth.mockReturnValue({ user: null });
    renderHome();
    expect(screen.getByText("destino login")).toBeInTheDocument();
  });
});
