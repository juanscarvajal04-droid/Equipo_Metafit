// frontend_web/src/views/__tests__/RutinasView.test.jsx
// Smoke test de la vista más grande: render, carga de datos, modales y plan.
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import RutinasView from "../RutinasView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../hooks/useAutoRefresh", () => ({ default: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));

const AFILIADOS = [
  {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@metafit.com",
    objetivo_fisico: "Perdida de grasa",
    nivel_experiencia: "Intermedio",
    disponibilidad_semanal_dias: 4,
    ciclo_activo: { id_ciclo: 10, plan_entrenamiento: { id_plan: 1 } },
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    nivel_experiencia: "Principiante",
    disponibilidad_semanal_dias: 3,
    ciclo_activo: null,
  },
];

const EJERCICIOS = [
  {
    id_ejercicio: 5,
    nombre_ejercicio: "Sentadilla",
    grupo_muscular: "Piernas",
    nivel_minimo: "Principiante",
  },
];

const PLAN = {
  id_plan: 1,
  rutinas: [
    {
      id_rutina: 11,
      dia_numero: 1,
      enfoque_muscular: "Piernas",
      ejercicios: [
        {
          id_ejercicio: 5,
          nombre_ejercicio: "Sentadilla",
          series: 3,
          repeticiones: 12,
          peso_kg: 20,
        },
      ],
    },
  ],
};

const CICLOS = [
  {
    id_ciclo: 10,
    fecha_inicio: "2026-10-01",
    fecha_fin: "2026-10-31",
    objetivo_fisico: "Perdida de grasa",
    nivel_experiencia: "Intermedio",
    disponibilidad_dias: 4,
    activo: 1,
  },
];

const NOTAS = [{
  id_nota: 1,
  id_ejercicio: 5,
  nombre_ejercicio: "Sentadilla",
  nota: "Subir peso",
  fecha_nota: "2026-10-02",
}];

function crearAuthAxios() {
  const get = vi.fn((url) => {
    if (url === "/afiliados") return Promise.resolve({ data: AFILIADOS });
    if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
    if (url.includes("/ejercicios-disponibles")) return Promise.resolve({ data: EJERCICIOS });
    if (url.includes("/notas-ejercicio")) return Promise.resolve({ data: NOTAS });
    if (url.includes("/planes/entrenamiento/")) return Promise.resolve({ data: PLAN });
    if (url.includes("/ciclos")) return Promise.resolve({ data: CICLOS });
    return Promise.resolve({ data: [] });
  });
  return {
    get,
    post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView() {
  return render(
    <MemoryRouter>
      <RutinasView />
    </MemoryRouter>
  );
}

describe("RutinasView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { role: "Administrador" },
      authAxios: crearAuthAxios(),
    });
    useToast.mockReturnValue({ toast: {}, showToast: vi.fn() });
  });

  test("renderiza KPIs, afiliados con y sin plan y abre los modales principales", async () => {
    renderView();

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Total Afiliados")).toBeInTheDocument();
    expect(screen.getByText("Con Plan de Entrenamiento")).toBeInTheDocument();
    expect(screen.getByText("Sin Plan Asignado")).toBeInTheDocument();
    expect(screen.getByText(/Activo/)).toBeInTheDocument();
    expect(screen.getByText("Sin plan")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Ver Catálogo/));
    expect(await screen.findByRole("heading", { name: /Catálogo de Ejercicios/ })).toBeInTheDocument();
    expect(await screen.findByText("Sentadilla")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cerrar"));

    fireEvent.click(screen.getByText(/Agregar Ejercicio/));
    expect(await screen.findByRole("heading", { name: /Nuevo Ejercicio/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getByText(/Eliminar Ejercicio/));
    expect(await screen.findByRole("heading", { name: /Eliminar Ejercicio/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getByText(/Asignar Rutina/));
    expect(await screen.findByRole("heading", { name: /Asignar Rutina/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getAllByTitle("Historial de ciclos")[0]);
    expect(await screen.findByRole("heading", { name: /Historial de Ciclos/ })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Historial de Ciclos/ })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getAllByTitle("Historial de ciclos")[0]);
    expect(await screen.findByRole("heading", { name: /Historial de Ciclos/ })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Historial de Ciclos/ })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getAllByTitle("Historial de ciclos")[0]);
    expect(await screen.findByRole("heading", { name: /Historial de Ciclos/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Editar"));
    fireEvent.change(await screen.findByLabelText("Inicio"), { target: { value: "2026-10-02" } });
    fireEvent.change(screen.getByLabelText("Fin"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("Objetivo"), { target: { value: "Mantenimiento" } });
    fireEvent.change(screen.getByLabelText("Nivel"), { target: { value: "Avanzado" } });
    fireEvent.change(screen.getByLabelText("Días/sem"), { target: { value: "5" } });
    fireEvent.click(screen.getByLabelText("Activo"));
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => expect(screen.getByTitle("Editar")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Cerrar"));

    fireEvent.click(screen.getByTitle("Ver"));
    await waitFor(() => expect(screen.getByTitle("Recargar")).toBeInTheDocument());
    expect((await screen.findAllByText("Piernas")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Ver Notas del Afiliado/ }));
    expect(await screen.findByRole("heading", { name: /Notas del Afiliado — Ana Pérez/ })).toBeInTheDocument();
    const dialogNotas = screen.getByRole("dialog");
    expect(within(dialogNotas).getByText(/🏋️ Sentadilla/)).toBeInTheDocument();
    expect(within(dialogNotas).getByText("Subir peso")).toBeInTheDocument();
    expect(within(dialogNotas).getByText(/2026-10-02/)).toBeInTheDocument();
    fireEvent.click(within(dialogNotas).getByRole("button", { name: "Cerrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByText("Cerrar"));
  }, 15000);
});
