// frontend_web/src/views/__tests__/DietasView.interacciones.test.jsx
// Cubre los flujos de envío: asignar dieta (con y sin ciclo), crear/editar/
// eliminar alimento del catálogo, errores de carga y filtro de búsqueda.
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useAutoRefresh", () => ({ default: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));

import DietasView from "../DietasView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { trackEvent } from "../../utils/analytics";

const ALIMENTOS = [
  { id_alimento: 5, nombre_alimento: "Pechuga de pollo", proteinas: 31, carbohidratos: 0, grasas: 3.6, calorias_por_100g: 165 },
  { id_alimento: 6, nombre_alimento: "Arroz blanco", proteinas: 2.7, carbohidratos: 28, grasas: 0.3, calorias_por_100g: 130 },
];

const ANA = {
  id_usuario: 1,
  nombres: "Ana",
  apellidos: "Pérez",
  correo: "ana@metafit.com",
  objetivo_fisico: "Perdida de grasa",
  nivel_experiencia: "Intermedio",
  disponibilidad_semanal_dias: 4,
  ciclo_activo: { id_ciclo: 10, plan_nutricional: { id_plan_nutricional: 1 } },
};

const LUIS = {
  id_usuario: 2,
  nombres: "Luis",
  apellidos: "Gómez",
  correo: "luis@metafit.com",
  objetivo_fisico: "Mantenimiento",
  nivel_experiencia: "Principiante",
  disponibilidad_semanal_dias: 3,
  ciclo_activo: null,
};

function crearAxios(overrides = {}) {
  return {
    get: vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: overrides.afiliados ?? [ANA, LUIS] });
      if (url === "/catalogo/alimentos") return Promise.resolve({ data: ALIMENTOS });
      if (url.includes("/alimentos-disponibles")) return Promise.resolve({ data: ALIMENTOS });
      if (url.startsWith("/planes/nutricional/")) return Promise.reject({ response: { status: 404 } });
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockResolvedValue({ data: { id: 50, id_ciclo: 99 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    ...overrides,
  };
}

let showToast;

function montar(axios = crearAxios()) {
  showToast = vi.fn();
  useToast.mockReturnValue({ toast: {}, showToast });
  useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios: axios });
  return render(
    <MemoryRouter>
      <DietasView />
    </MemoryRouter>
  );
}

describe("DietasView — interacciones de envío", () => {
  beforeEach(() => vi.clearAllMocks());

  test("asigna dieta completa a un afiliado sin ciclo", async () => {
    const authAxios = crearAxios({ afiliados: [LUIS] });
    montar(authAxios);

    await screen.findByText("Luis Gómez");
    const fila = screen.getByText("Luis Gómez").closest("tr");
    fireEvent.click(within(fila).getByText("➕ Asignar"));

    expect(await screen.findByText(/Alimentos disponibles \(2\)/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(await screen.findByLabelText("Gramos/comida"), { target: { value: "250" } });
    fireEvent.change(screen.getByLabelText("N° Comida"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Calorías objetivo"), { target: { value: "1800" } });
    fireEvent.change(screen.getByLabelText("💧 Recomendación de agua diaria (vasos)"), { target: { value: "8" } });

    fireEvent.submit(screen.getByText("✅ Crear Plan Nutricional").closest("form"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Plan nutricional creado exitosamente", "success")
    );
    expect(authAxios.post).toHaveBeenCalledWith(
      "/afiliados/ciclos",
      expect.objectContaining({ id_usuario: 2, disponibilidad_dias: 3 })
    );
    expect(authAxios.post).toHaveBeenCalledWith(
      "/planes/nutricional",
      expect.objectContaining({ id_ciclo: 99, calorias_objetivo: 1800, recomendacion_agua_vasos: 8 })
    );
    expect(authAxios.post).toHaveBeenCalledWith("/planes/nutricional/99/detalle", {
      id_alimento: 5,
      cantidad_g: 250,
      num_comida: 2,
    });
    expect(trackEvent).toHaveBeenCalledWith("metaFit_dieta_asignada", { afiliado_id: 2 });
  });

  test("reutiliza ciclo y plan existente mediante PATCH", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/catalogo/alimentos") return Promise.resolve({ data: ALIMENTOS });
      if (url.includes("/alimentos-disponibles")) return Promise.resolve({ data: ALIMENTOS });
      if (url === "/planes/nutricional/10") return Promise.resolve({ data: { id_plan_nutricional: 1 } });
      return Promise.resolve({ data: [] });
    });
    montar(authAxios);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText("🔄 Nueva"));

    expect(await screen.findByText(/Ciclo activo detectado \(ID: 10\)/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(await screen.findByLabelText("Calorías objetivo"), { target: { value: "2200" } });
    fireEvent.change(screen.getByLabelText("Nº de comidas"), { target: { value: "4" } });
    fireEvent.submit(screen.getByText("✅ Crear Plan Nutricional").closest("form"));

    await waitFor(() =>
      expect(authAxios.patch).toHaveBeenCalledWith(
        "/planes/nutricional/10",
        expect.objectContaining({ calorias_objetivo: 2200, num_comidas: 4 })
      )
    );
    expect(authAxios.post).not.toHaveBeenCalledWith("/afiliados/ciclos", expect.anything());
    expect(authAxios.post).toHaveBeenCalledWith(
      "/planes/nutricional/10/detalle",
      expect.objectContaining({ id_alimento: 5 })
    );
  });

  test("avisa si no hay alimentos seleccionados", async () => {
    const authAxios = crearAxios({ afiliados: [LUIS] });
    montar(authAxios);

    await screen.findByText("Luis Gómez");
    fireEvent.click(screen.getByText("➕ Asignar Dieta"));

    expect(await screen.findByRole("heading", { name: /Asignar Dieta/ })).toBeInTheDocument();
    fireEvent.submit(screen.getByText("✅ Crear Plan Nutricional").closest("form"));

    expect(showToast).toHaveBeenCalledWith("Selecciona al menos un alimento", "danger");
    expect(authAxios.post).not.toHaveBeenCalledWith("/afiliados/ciclos", expect.anything());
  });

  test("crea un alimento nuevo y valida el nombre obligatorio", async () => {
    const authAxios = crearAxios();
    montar(authAxios);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/➕ Agregar Alimento/));
    expect(await screen.findByRole("heading", { name: /Nuevo Alimento/ })).toBeInTheDocument();

    fireEvent.submit(screen.getByText("💾 Guardar").closest("form"));
    expect(showToast).toHaveBeenCalledWith("El nombre es obligatorio", "danger");
    expect(authAxios.post).not.toHaveBeenCalledWith("/catalogo/alimentos", expect.anything());

    fireEvent.change(screen.getByLabelText("Nombre del alimento *"), { target: { value: "Avena" } });
    fireEvent.change(screen.getByLabelText("Proteínas (g)"), { target: { value: "13" } });
    fireEvent.change(screen.getByLabelText("Carbohidratos (g)"), { target: { value: "66" } });
    fireEvent.change(screen.getByLabelText("Grasas (g)"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Calorías por 100g"), { target: { value: "389" } });
    fireEvent.submit(screen.getByText("💾 Guardar").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Alimento creado", "success"));
    expect(authAxios.post).toHaveBeenCalledWith("/catalogo/alimentos", {
      nombre_alimento: "Avena",
      proteinas: "13",
      carbohidratos: "66",
      grasas: "7",
      calorias_por_100g: "389",
    });
  });

  test("edita un alimento desde el catálogo", async () => {
    const authAxios = crearAxios();
    montar(authAxios);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/Ver Catálogo/));
    fireEvent.click((await screen.findAllByText("✏️"))[0]);
    expect(await screen.findByRole("heading", { name: /Editar Alimento/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombre del alimento *"), { target: { value: "Pollo grill" } });
    fireEvent.submit(screen.getByText("💾 Guardar Cambios").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Alimento actualizado", "success"));
    expect(authAxios.put).toHaveBeenCalledWith(
      "/catalogo/alimentos/5",
      expect.objectContaining({ nombre_alimento: "Pollo grill", proteinas: 31 })
    );
  });

  test("elimina un alimento y maneja el conflicto 409", async () => {
    const authAxios = crearAxios();
    authAxios.delete
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({ response: { status: 409 } });
    montar(authAxios);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/🗑️ Eliminar Alimento/));
    fireEvent.change(await screen.findByLabelText("Seleccionar alimento"), { target: { value: "5" } });
    fireEvent.submit(screen.getByText("🗑️ Eliminar").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Alimento eliminado", "success"));
    expect(authAxios.delete).toHaveBeenCalledWith("/catalogo/alimentos/5");

    fireEvent.click(screen.getByText(/🗑️ Eliminar Alimento/));
    fireEvent.change(await screen.findByLabelText("Seleccionar alimento"), { target: { value: "6" } });
    fireEvent.submit(screen.getByText("🗑️ Eliminar").closest("form"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "No se puede eliminar: el alimento está siendo usado en planes activos",
        "danger"
      )
    );
  });

  test("muestra toasts de error si fallan las cargas", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.reject(new Error("net"));
      if (url === "/catalogo/alimentos") return Promise.reject(new Error("net"));
      return Promise.resolve({ data: [] });
    });
    montar(authAxios);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Error al cargar afiliados", "danger");
      expect(showToast).toHaveBeenCalledWith("Error al cargar catálogo de alimentos", "danger");
    });
  });

  test("filtra por nombre y muestra el estado vacío", async () => {
    montar();

    await screen.findByText("Luis Gómez");

    fireEvent.change(screen.getByPlaceholderText("Buscar afiliado..."), { target: { value: "ana@metafit" } });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar afiliado..."), { target: { value: "zzz" } });
    expect(screen.getByText("No se encontraron afiliados")).toBeInTheDocument();
  });
});
