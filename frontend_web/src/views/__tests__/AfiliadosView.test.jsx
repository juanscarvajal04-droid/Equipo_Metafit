// frontend_web/src/views/__tests__/AfiliadosView.test.jsx
// Smoke test del CRUD visual de afiliados: tabla, detalle, edición, creación y borrado.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import AfiliadosView from "../AfiliadosView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../hooks/useAutoRefresh", () => ({ default: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../components/common/RestriccionSelector", () => ({
  default: () => <div data-testid="restricciones-selector" />,
}));

const AFILIADOS = [
  {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@metafit.com",
    telefono: "3001234567",
    documento: "123456",
    fecha_nacimiento: "1995-04-12",
    sexo: "Femenino",
    estatura_cm: 165,
    direccion: "Calle 1",
    objetivo_fisico: "Perdida de grasa",
    grupo_muscular_prioritario: "Piernas",
    nivel_experiencia: "Intermedio",
    disponibilidad_semanal_dias: 4,
    estado: "Activo",
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    objetivo_fisico: "Mantenimiento",
    nivel_experiencia: "Principiante",
    disponibilidad_semanal_dias: 3,
    estado: "Inactivo",
  },
];

const DETALLE = {
  ...AFILIADOS[0],
  restricciones: [],
  ultimo_pago: { valor_pagado: 85000, fecha_pago: "2026-10-01" },
  progreso_fisico: [{ fecha_registro: "2026-10-01", peso_kg: 70 }],
  ciclo_activo: { fecha_inicio: "2026-10-01", fecha_fin: "2026-10-31" },
};

let authAxiosMock;

function crearAuthAxios() {
  return {
    get: vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: AFILIADOS });
      if (url === "/afiliados/1") return Promise.resolve({ data: DETALLE });
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: { id: 3 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView() {
  return render(
    <MemoryRouter>
      <AfiliadosView />
    </MemoryRouter>
  );
}

function inputPorLabel(label) {
  const nodo = screen.getByText(label).parentElement;
  return nodo.querySelector("input, select, textarea");
}

describe("AfiliadosView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = crearAuthAxios();
    useAuth.mockReturnValue({
      user: { role: "Administrador" },
      authAxios: authAxiosMock,
    });
    useToast.mockReturnValue({ toast: {}, showToast: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renderiza la tabla y cubre detalle, edición, creación y eliminación", async () => {
    renderView();

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Perdida de grasa")).toBeInTheDocument();
    expect(screen.getByText("Intermedio")).toBeInTheDocument();
    expect(screen.getAllByText("Activo").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    expect(await screen.findByRole("heading", { name: /Ana Pérez/ })).toBeInTheDocument();
    expect(screen.getAllByText("ana@metafit.com").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Progreso Físico"));
    expect(screen.getByText(/Peso: 70 kg/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ciclo Activo"));
    expect(screen.getByText("Ciclo activo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cerrar"));

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    expect(await screen.findByRole("heading", { name: /Editar: Ana Pérez/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(authAxiosMock.patch).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/Nuevo afiliado/));
    expect(await screen.findByRole("heading", { name: /Nuevo afiliado/ })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Nuevo afiliado/ })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByText(/Nuevo afiliado/));
    expect(await screen.findByRole("heading", { name: /Nuevo afiliado/ })).toBeInTheDocument();
    fireEvent.change(inputPorLabel("Nombres"), { target: { value: "Nuevo" } });
    fireEvent.change(inputPorLabel("Apellidos"), { target: { value: "Afiliado" } });
    fireEvent.change(inputPorLabel("Correo"), { target: { value: "nuevo@metafit.com" } });
    fireEvent.change(inputPorLabel("Documento"), { target: { value: "999999" } });
    fireEvent.change(inputPorLabel("Otros antecedentes (texto libre)"), {
      target: { value: "Sin antecedentes" },
    });
    fireEvent.click(screen.getByText("Crear afiliado"));
    await waitFor(() => expect(authAxiosMock.post).toHaveBeenCalledWith(
      "/afiliados",
      expect.objectContaining({ nombres: "Nuevo", correo: "nuevo@metafit.com" })
    ));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    await waitFor(() => expect(authAxiosMock.delete).toHaveBeenCalledWith("/afiliados/1"));
  });

  test("cierra los modales de detalle y edición con overlay y Escape", async () => {
    renderView();
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Ana Pérez/ });
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Ana Pérez/ })).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    let overlay = await screen.findByLabelText("Cerrar modal");
    fireEvent.keyDown(overlay, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Ana Pérez/ })).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    await screen.findByRole("heading", { name: /Editar: Ana Pérez/ });
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Editar: Ana Pérez/ })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    overlay = await screen.findByLabelText("Cerrar modal");
    fireEvent.keyDown(overlay, { key: "Enter" });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Editar: Ana Pérez/ })
      ).not.toBeInTheDocument()
    );
  });
});
