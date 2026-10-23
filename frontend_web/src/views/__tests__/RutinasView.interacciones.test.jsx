// frontend_web/src/views/__tests__/RutinasView.interacciones.test.jsx
// Cubre los flujos de envío: asignar rutina (con y sin ciclo), guardar/editar/
// eliminar ejercicio del catálogo, errores de carga y filtro de búsqueda.
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

import RutinasView from "../RutinasView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { trackEvent } from "../../utils/analytics";

const EJERCICIOS = [
  { id_ejercicio: 5, nombre_ejercicio: "Sentadilla", grupo_muscular: "Piernas", nivel_minimo: "Principiante" },
  { id_ejercicio: 6, nombre_ejercicio: "Remo con barra", grupo_muscular: "Espalda", nivel_minimo: "Intermedio" },
];

const ANA = {
  id_usuario: 1,
  nombres: "Ana",
  apellidos: "Pérez",
  correo: "ana@metafit.com",
  objetivo_fisico: "Perdida de grasa",
  nivel_experiencia: "Intermedio",
  disponibilidad_semanal_dias: 4,
  ciclo_activo: { id_ciclo: 10, plan_entrenamiento: { id_plan: 1 } },
};

const LUIS = {
  id_usuario: 2,
  nombres: "Luis",
  apellidos: "Gómez",
  correo: "luis@metafit.com",
  objetivo_fisico: "Aumento de masa",
  nivel_experiencia: "Principiante",
  disponibilidad_semanal_dias: 3,
  ciclo_activo: null,
};

function crearAxios(overrides = {}) {
  const get = vi.fn((url) => {
    if (url === "/afiliados") return Promise.resolve({ data: overrides.afiliados ?? [ANA, LUIS] });
    if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
    if (url.includes("/ejercicios-disponibles")) return Promise.resolve({ data: EJERCICIOS });
    if (url.startsWith("/planes/entrenamiento/")) return Promise.reject({ response: { status: 404 } });
    return Promise.resolve({ data: [] });
  });
  return {
    get: overrides.get ?? get,
    post: vi.fn().mockResolvedValue({ data: { id: 50, id_ciclo: 99 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

let showToast;

function montar() {
  showToast = vi.fn();
  useToast.mockReturnValue({ toast: {}, showToast });
  return render(
    <MemoryRouter>
      <RutinasView />
    </MemoryRouter>
  );
}

describe("RutinasView — interacciones de envío", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios: crearAxios() });
  });

  test("asigna rutina completa a un afiliado sin ciclo", async () => {
    const authAxios = crearAxios({ afiliados: [LUIS] });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Luis Gómez");
    const fila = screen.getByText("Luis Gómez").closest("tr");
    fireEvent.click(within(fila).getByText("➕ Asignar"));

    expect(await screen.findByText(/Ejercicios disponibles \(2\)/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(await screen.findByLabelText("Series"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Día"), { target: { value: "2" } });

    fireEvent.click(screen.getByText("✅ Crear Plan de Entrenamiento"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Plan de entrenamiento creado correctamente", "success")
    );
    expect(authAxios.post).toHaveBeenCalledWith(
      "/afiliados/ciclos",
      expect.objectContaining({ id_usuario: 2, disponibilidad_dias: 3 })
    );
    expect(authAxios.post).toHaveBeenCalledWith("/planes/entrenamiento", { id_ciclo: 99 });
    expect(authAxios.post).toHaveBeenCalledWith(
      "/planes/rutinas",
      expect.objectContaining({ id_ciclo: 99, dia_numero: 2 })
    );
    expect(authAxios.post).toHaveBeenCalledWith(
      "/planes/rutinas/50/ejercicios",
      expect.objectContaining({ id_ejercicio: 5, series: 4 })
    );
    expect(trackEvent).toHaveBeenCalledWith("metaFit_rutina_asignada", { afiliado_id: 2 });
  });

  test("reutiliza el ciclo y reemplaza la rutina existente del día", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
      if (url.includes("/ejercicios-disponibles")) return Promise.resolve({ data: EJERCICIOS });
      if (url === "/planes/entrenamiento/10")
        return Promise.resolve({ data: { rutinas: [{ dia_numero: 1, id_rutina: 7 }] } });
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText("🔄 Nueva"));

    expect(await screen.findByText(/Ciclo activo detectado \(ID: 10\)/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByText("✅ Crear Plan de Entrenamiento"));

    await waitFor(() => expect(authAxios.patch).toHaveBeenCalledWith("/planes/entrenamiento/10", { observaciones: "" }));
    expect(authAxios.post).not.toHaveBeenCalledWith("/afiliados/ciclos", expect.anything());
    await waitFor(() => expect(authAxios.delete).toHaveBeenCalledWith("/planes/rutinas/7"));
  });

  test("avisa si no hay ejercicio seleccionado y permite cerrar con overlay", async () => {
    const authAxios = crearAxios({ afiliados: [LUIS] });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Luis Gómez");
    fireEvent.click(screen.getByText("➕ Asignar Rutina").closest("button"));

    expect(await screen.findByRole("heading", { name: /Asignar Rutina/ })).toBeInTheDocument();
    fireEvent.submit(screen.getByText("✅ Crear Plan de Entrenamiento").closest("form"));
    expect(showToast).toHaveBeenCalledWith("Selecciona al menos un ejercicio", "danger");
    expect(authAxios.post).not.toHaveBeenCalledWith("/afiliados/ciclos", expect.anything());

    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Asignar Rutina/ })).not.toBeInTheDocument()
    );
  });

  test("crea un ejercicio nuevo y valida el nombre obligatorio", async () => {
    const authAxios = crearAxios();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/➕ Agregar Ejercicio/));
    expect(await screen.findByRole("heading", { name: /Nuevo Ejercicio/ })).toBeInTheDocument();

    fireEvent.submit(screen.getByText("💾 Guardar").closest("form"));
    expect(showToast).toHaveBeenCalledWith("El nombre es obligatorio", "danger");
    expect(authAxios.post).not.toHaveBeenCalledWith("/catalogo/ejercicios", expect.anything());

    fireEvent.change(screen.getByLabelText("Nombre del ejercicio *"), { target: { value: "Press banca" } });
    fireEvent.change(screen.getByLabelText("Grupo muscular"), { target: { value: "Pecho" } });
    fireEvent.change(screen.getByLabelText("Nivel mínimo"), { target: { value: "Intermedio" } });
    fireEvent.change(screen.getByLabelText("Descripción (opcional)"), { target: { value: "Barra recta" } });
    fireEvent.submit(screen.getByText("💾 Guardar").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Ejercicio creado", "success"));
    expect(authAxios.post).toHaveBeenCalledWith("/catalogo/ejercicios", {
      nombre_ejercicio: "Press banca",
      grupo_muscular: "Pecho",
      nivel_minimo: "Intermedio",
      descripcion: "Barra recta",
    });
  });

  test("edita un ejercicio existente desde el catálogo", async () => {
    const authAxios = crearAxios();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/Ver Catálogo/));
    fireEvent.click((await screen.findAllByText("✏️"))[0]);
    expect(await screen.findByRole("heading", { name: /Editar Ejercicio/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombre del ejercicio *"), { target: { value: "Sentadilla búlgara" } });
    fireEvent.click(screen.getByText("💾 Guardar Cambios"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Ejercicio actualizado", "success"));
    expect(authAxios.put).toHaveBeenCalledWith(
      "/catalogo/ejercicios/5",
      expect.objectContaining({ nombre_ejercicio: "Sentadilla búlgara" })
    );
  });

  test("elimina un ejercicio y maneja el conflicto 409", async () => {
    const authAxios = crearAxios();
    authAxios.delete
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({ response: { status: 409 } });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/🗑️ Eliminar Ejercicio/));
    fireEvent.change(await screen.findByLabelText("Seleccionar ejercicio"), { target: { value: "5" } });
    fireEvent.click(screen.getByText("🗑️ Eliminar"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Ejercicio eliminado", "success"));
    expect(authAxios.delete).toHaveBeenCalledWith("/catalogo/ejercicios/5");

    fireEvent.click(screen.getByText(/🗑️ Eliminar Ejercicio/));
    fireEvent.change(await screen.findByLabelText("Seleccionar ejercicio"), { target: { value: "6" } });
    fireEvent.click(screen.getByText("🗑️ Eliminar"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "No se puede eliminar: el ejercicio está siendo usado en planes activos",
        "danger"
      )
    );
  });

  test("muestra toasts de error si fallan las cargas", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.reject(new Error("net"));
      if (url === "/catalogo/ejercicios") return Promise.reject(new Error("net"));
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Error al cargar afiliados", "danger");
      expect(showToast).toHaveBeenCalledWith("Error al cargar catálogo de ejercicios", "danger");
    });
  });

  test("filtra por correo y muestra el estado vacío", async () => {
    const authAxios = crearAxios();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Luis Gómez");

    fireEvent.change(screen.getByPlaceholderText("Buscar afiliado..."), { target: { value: "ana@metafit" } });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar afiliado..."), { target: { value: "zzz" } });
    expect(screen.getByText("No se encontraron afiliados")).toBeInTheDocument();
  });

  test("error al cargar ejercicios disponibles del afiliado", async () => {
    const authAxios = crearAxios({ afiliados: [LUIS] });
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [LUIS] });
      if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
      if (url.includes("/ejercicios-disponibles")) return Promise.reject(new Error("net"));
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Luis Gómez");
    fireEvent.click(screen.getByText("➕ Asignar"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Error al cargar ejercicios disponibles", "danger")
    );
  });

  test("cierra catálogo, ejercicio, eliminar y ver rutina con Escape", async () => {
    const authAxios = crearAxios();
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getByText(/Ver Catálogo/));
    await screen.findByRole("heading", { name: /Catálogo de Ejercicios/ });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Catálogo de Ejercicios/ })).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/➕ Agregar Ejercicio/));
    await screen.findByRole("heading", { name: /Nuevo Ejercicio/ });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Nuevo Ejercicio/ })).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/🗑️ Eliminar Ejercicio/));
    await screen.findByRole("heading", { name: /Eliminar Ejercicio/ });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Eliminar Ejercicio/ })).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Rutina: Ana Pérez/ });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Rutina: Ana Pérez/ })).not.toBeInTheDocument()
    );
  });

  test("edita y quita un ejercicio del plan activo", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/planes/entrenamiento/10")
        return Promise.resolve({
          data: {
            rutinas: [
              {
                id_rutina: 7,
                dia_numero: 1,
                ejercicios: [
                  { id_ejercicio: 5, nombre_ejercicio: "Sentadilla", series: 3, repeticiones: 12, peso_kg: 20 },
                ],
              },
            ],
          },
        });
      if (url.startsWith("/afiliados/1/notas-ejercicio")) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    expect(await screen.findByRole("heading", { name: /Rutina: Ana Pérez/ })).toBeInTheDocument();
    expect(await screen.findByText("Sentadilla")).toBeInTheDocument();

    const fila = screen.getByText("Sentadilla").closest("tr");
    fireEvent.click(within(fila).getByTitle("Editar serie/reps/peso"));
    const inputs = within(fila).getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "4" } });
    fireEvent.change(inputs[1], { target: { value: "10" } });
    fireEvent.change(inputs[2], { target: { value: "25" } });
    fireEvent.click(within(fila).getByText("💾"));

    await waitFor(() =>
      expect(authAxios.patch).toHaveBeenCalledWith("/planes/rutinas/7/ejercicios/5", {
        series: 4,
        repeticiones: 10,
        peso_kg: 25,
      })
    );
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Ejercicio actualizado", "success"));

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(within(fila).getByTitle("Quitar de la rutina"));
    await waitFor(() =>
      expect(authAxios.delete).toHaveBeenCalledWith("/planes/rutinas/7/ejercicios/5")
    );
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Ejercicio eliminado de la rutina", "success")
    );
    confirmSpy.mockRestore();
  });

  test("agrega por grupo muscular, quita selección y maneja fallos al asignar", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
      if (url.includes("/ejercicios-disponibles")) return Promise.resolve({ data: EJERCICIOS });
      if (url === "/planes/entrenamiento/10")
        return Promise.resolve({ data: { rutinas: [{ dia_numero: 1, id_rutina: 7 }] } });
      return Promise.resolve({ data: [] });
    });
    authAxios.delete.mockRejectedValueOnce(new Error("delete boom"));
    authAxios.post.mockRejectedValueOnce(new Error("assign boom"));
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText("🔄 Nueva"));
    expect(await screen.findByText(/Ciclo activo detectado/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("➕ Piernas"));
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    fireEvent.click(screen.getByText("✅ Crear Plan de Entrenamiento"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("assign boom", "danger"));
  });

  test("muestra error al guardar un ejercicio del catálogo", async () => {
    const authAxios = crearAxios();
    authAxios.post.mockRejectedValueOnce(new Error("save boom"));
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByText(/➕ Agregar Ejercicio/));
    fireEvent.change(await screen.findByLabelText("Nombre del ejercicio *"), {
      target: { value: "Press militar" },
    });
    fireEvent.submit(screen.getByText("💾 Guardar").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("save boom", "danger"));
  });

  test("edita y elimina ciclos del historial con éxito y error", async () => {
    const authAxios = crearAxios();
    const ciclo = {
      id_ciclo: 10,
      fecha_inicio: "2026-01-01",
      fecha_fin: "2026-03-31",
      objetivo_fisico: "Perdida de grasa",
      nivel_experiencia: "Intermedio",
      disponibilidad_dias: 4,
      activo: 1,
      numero_ciclo: 1,
    };
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
      if (url === "/afiliados/1/ciclos") return Promise.resolve({ data: [ciclo] });
      if (url === "/planes/entrenamiento/10")
        return Promise.resolve({
          data: {
            rutinas: [
              {
                id_rutina: 7,
                dia_numero: 1,
                ejercicios: [
                  { id_ejercicio: 5, nombre_ejercicio: "Sentadilla", series: 3, repeticiones: 12 },
                ],
              },
            ],
          },
        });
      if (url.startsWith("/afiliados/1/notas-ejercicio"))
        return Promise.reject(new Error("notes boom"));
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByTitle("Historial de ciclos"));
    expect(
      await screen.findByRole("heading", { name: /Historial de Ciclos/ })
    ).toBeInTheDocument();
    await screen.findByText(/#10/);

    authAxios.patch.mockRejectedValueOnce(new Error("update boom"));
    fireEvent.click(screen.getByTitle("Editar"));
    fireEvent.click(await screen.findByText("💾 Guardar"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("update boom", "danger"));

    authAxios.patch.mockResolvedValueOnce({ data: {} });
    fireEvent.click(screen.getByText("💾 Guardar"));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Ciclo actualizado correctamente", "success")
    );

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    authAxios.delete.mockRejectedValueOnce(new Error("delete cycle boom"));
    fireEvent.click(screen.getByTitle("Eliminar"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("delete cycle boom", "danger"));

    authAxios.delete.mockResolvedValueOnce({ data: {} });
    fireEvent.click(screen.getByTitle("Eliminar"));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Ciclo eliminado correctamente", "success")
    );
    confirmSpy.mockRestore();

    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Historial de Ciclos/ })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    expect(await screen.findByRole("heading", { name: /Rutina: Ana Pérez/ })).toBeInTheDocument();
    expect(await screen.findByText("Sentadilla")).toBeInTheDocument();

    const fila = screen.getByText("Sentadilla").closest("tr");
    fireEvent.click(within(fila).getByTitle("Editar serie/reps/peso"));
    authAxios.patch.mockRejectedValueOnce(new Error("exercise boom"));
    fireEvent.click(within(fila).getByText("💾"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("exercise boom", "danger"));
    fireEvent.click(within(fila).getByText("✖"));

    authAxios.delete.mockRejectedValueOnce(new Error("remove boom"));
    const confirmRemove = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(within(fila).getByTitle("Quitar de la rutina"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("remove boom", "danger"));
    confirmRemove.mockRestore();

    fireEvent.click(screen.getByText(/Ver Notas del Afiliado/));
    expect(
      await screen.findByRole("heading", { name: /Notas del Afiliado/ })
    ).toBeInTheDocument();
    fireEvent.keyDown(screen.getAllByLabelText("Cerrar notas del afiliado")[0], {
      key: "Escape",
    });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Notas del Afiliado/ })).not.toBeInTheDocument()
    );
  });

  test("muestra estados sin plan activo y error al cargar el plan", async () => {
    const authAxios = crearAxios();
    authAxios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: [ANA] });
      if (url === "/catalogo/ejercicios") return Promise.resolve({ data: EJERCICIOS });
      if (url === "/planes/entrenamiento/10") return Promise.reject(new Error("plan boom"));
      return Promise.resolve({ data: [] });
    });
    useAuth.mockReturnValue({ user: { role: "Administrador" }, authAxios });
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar();

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    expect(await screen.findByText("Error al cargar plan de entrenamiento")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal"), { key: "Escape" });

    const planOriginal = ANA.ciclo_activo.plan_entrenamiento;
    delete ANA.ciclo_activo.plan_entrenamiento;
    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    expect(
      await screen.findByText("Este afiliado no tiene un plan de entrenamiento activo")
    ).toBeInTheDocument();
    ANA.ciclo_activo.plan_entrenamiento = planOriginal;
  });
});
