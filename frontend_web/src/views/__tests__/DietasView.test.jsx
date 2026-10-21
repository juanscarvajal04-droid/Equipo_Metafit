// frontend_web/src/views/__tests__/DietasView.test.jsx
// Smoke test de planes nutricionales: carga, catálogo, modales y detalle del plan.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import DietasView from "../DietasView";
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
    objetivo: "Perdida de grasa",
    restricciones: [
      { id_restriccion: 1, nombre_restriccion: "Lactosa", tipo: "Alergia" },
    ],
    ciclo_activo: { id_ciclo: 20, plan_nutricional: { id_plan: 2 } },
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    objetivo: "Mantenimiento",
    restricciones: [],
    ciclo_activo: null,
  },
];

const ALIMENTOS = [
  {
    id_alimento: 5,
    nombre_alimento: "Pollo",
    proteinas: 20,
    carbohidratos: 0,
    grasas: 5,
    calorias_por_100g: 165,
  },
];

const PLAN = {
  id_ciclo: 20,
  calorias_objetivo: 2000,
  num_comidas: 2,
  observaciones: "Plan de prueba",
  recomendacion_agua_vasos: 8,
  detalle: [
    {
      id_alimento: 5,
      nombre_alimento: "Pollo",
      cantidad_g: 150,
      num_comida: 1,
    },
  ],
};

let authAxiosMock;

function crearAuthAxios() {
  const get = vi.fn((url) => {
    if (url === "/afiliados") return Promise.resolve({ data: AFILIADOS });
    if (url === "/catalogo/alimentos") return Promise.resolve({ data: ALIMENTOS });
    if (url.includes("/alimentos-disponibles")) return Promise.resolve({ data: ALIMENTOS });
    if (url.includes("/planes/nutricional/")) return Promise.resolve({ data: PLAN });
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
      <DietasView />
    </MemoryRouter>
  );
}

describe("DietasView", () => {
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

  test("renderiza KPIs y abre catálogo, modales y plan nutricional", async () => {
    renderView();

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Con Plan Nutricional")).toBeInTheDocument();
    expect(screen.getByText("Sin Plan Asignado")).toBeInTheDocument();
    expect(screen.getByText("Alimentos en Catálogo")).toBeInTheDocument();
    expect(screen.getByText(/Activo/)).toBeInTheDocument();
    expect(screen.getByText(/Sin plan/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Ver Catálogo/));
    expect(await screen.findByRole("heading", { name: /Catálogo de Alimentos/ })).toBeInTheDocument();
    expect(await screen.findByText("Pollo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cerrar"));

    fireEvent.click(screen.getByText(/Agregar Alimento/));
    expect(await screen.findByRole("heading", { name: /Nuevo Alimento/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getByText(/Eliminar Alimento/));
    expect(await screen.findByRole("heading", { name: /Eliminar Alimento/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getByText(/Asignar Dieta/));
    expect(await screen.findByRole("heading", { name: /Asignar Dieta/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    expect(await screen.findByLabelText(/Recomendación de agua diaria/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));

    fireEvent.click(screen.getByTitle("Ver"));
    expect(await screen.findByRole("heading", { name: /Plan Nutricional: Ana Pérez/ })).toBeInTheDocument();
    expect(await screen.findByText("Pollo")).toBeInTheDocument();
    expect(await screen.findByText(/8 vasos \/ 2\.0 L al día/)).toBeInTheDocument();

    const cantidad = screen.getByDisplayValue("150");
    fireEvent.change(cantidad, { target: { value: "200" } });
    fireEvent.click(screen.getByText(/Guardar/));
    await waitFor(() => expect(authAxiosMock.patch).toHaveBeenCalled());

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByText(/Quitar/));
    await waitFor(() => expect(authAxiosMock.delete).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Cerrar"));
  });

  test("envía la recomendación de agua al guardar el plan", async () => {
    renderView();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText("➕ Asignar"));
    expect(await screen.findByRole("heading", { name: /Asignar Dieta/ })).toBeInTheDocument();

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.change(screen.getByLabelText(/Recomendación de agua diaria/), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByText(/Crear Plan Nutricional/));

    await waitFor(() =>
      expect(authAxiosMock.patch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/planes\/nutricional\//),
        expect.objectContaining({ recomendacion_agua_vasos: 9 })
      )
    );
  });
});
