// frontend_web/src/views/__tests__/AfiliadosView.interacciones.test.jsx
// Cubre handlers del CRUD: restricciones (add/remove), errores del backend,
// eliminación cancelada/fallida, filtro y variantes de rol.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../hooks/useAutoRefresh", () => ({ default: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../components/common/RestriccionSelector", () => ({
  default: ({ onAdd, onRemove, readOnly, isRegistration }) => (
    <div data-testid={isRegistration ? "selector-registro" : "selector-detalle"}>
      {onAdd && (
        <button
          type="button"
          onClick={() => onAdd(isRegistration ? { id_restriccion: 7 } : 7)}
        >
          add-restriccion
        </button>
      )}
      {onRemove && <button type="button" onClick={() => onRemove(7)}>remove-restriccion</button>}
      {readOnly && <span>solo-lectura</span>}
    </div>
  ),
}));

import AfiliadosView from "../AfiliadosView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { trackEvent } from "../../utils/analytics";

const AFILIADOS = [
  {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@metafit.com",
    documento: "123456",
    estado: "Activo",
    objetivo_fisico: "Perdida de grasa",
    nivel_experiencia: "Intermedio",
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    documento: "654321",
    estado: "Inactivo",
    objetivo_fisico: "Mantenimiento",
    nivel_experiencia: "Principiante",
  },
];

const DETALLE = { ...AFILIADOS[0], restricciones: [] };

let showToast;
let authAxiosMock;

function crearAxios(overrides = {}) {
  return {
    get: vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: overrides.afiliados ?? AFILIADOS });
      if (url.startsWith("/afiliados/")) return Promise.resolve({ data: DETALLE });
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: { id: 3 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    ...overrides,
  };
}

function montar(rol = "Administrador", axios = crearAxios()) {
  showToast = vi.fn();
  useToast.mockReturnValue({ toast: {}, showToast });
  authAxiosMock = axios;
  useAuth.mockReturnValue({ user: { role: rol }, authAxios: axios });
  return render(
    <MemoryRouter>
      <AfiliadosView />
    </MemoryRouter>
  );
}

describe("AfiliadosView — interacciones", () => {
  beforeEach(() => vi.clearAllMocks());

  test("asigna y remueve restricciones desde el detalle (refresco sin cerrar)", async () => {
    montar("Administrador");
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Ana Pérez/ });
    expect(screen.getByTestId("selector-detalle")).toBeInTheDocument();

    fireEvent.click(screen.getByText("add-restriccion"));
    await waitFor(() =>
      expect(authAxiosMock.post).toHaveBeenCalledWith("/afiliados/1/restricciones", { id_restriccion: 7 })
    );
    expect(showToast).toHaveBeenCalledWith("Restricción asignada correctamente", "success");
    expect(trackEvent).toHaveBeenCalledWith("metaFit_restriccion_asignada", { afiliado: 1, restriccion: 7 });

    fireEvent.click(screen.getByText("remove-restriccion"));
    await waitFor(() =>
      expect(authAxiosMock.delete).toHaveBeenCalledWith("/afiliados/1/restricciones/7")
    );
    expect(showToast).toHaveBeenCalledWith("Restricción removida correctamente", "success");
    expect(trackEvent).toHaveBeenCalledWith("metaFit_restriccion_removida", { afiliado: 1, restriccion: 7 });
  });

  test("errores al asignar o remover restricción muestran toast", async () => {
    const axios = crearAxios();
    axios.post.mockRejectedValue({ response: { data: { error: "boom" } } });
    axios.delete.mockRejectedValue({ response: { data: { error: "boom" } } });
    montar("Administrador", axios);
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Ana Pérez/ });

    fireEvent.click(screen.getByText("add-restriccion"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Error al asignar restricción", "danger"));

    fireEvent.click(screen.getByText("remove-restriccion"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Error al remover restricción", "danger"));
  });

  test("crea afiliado con restricción temporal y tolera error al asignarla", async () => {
    const axios = crearAxios();
    axios.post.mockImplementation((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: { id: 3 } });
      if (url.endsWith("/restricciones")) return Promise.reject({ response: { data: { error: "dup" } } });
      return Promise.resolve({ data: {} });
    });
    montar("Recepcionista", axios);
    await screen.findByText("Ana Pérez");
    expect(screen.getByText("Registro y consulta de afiliados")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Nuevo afiliado/));
    await screen.findByRole("heading", { name: /Nuevo afiliado/ });

    fireEvent.click(screen.getByText("add-restriccion"));
    expect(screen.getByText("remove-restriccion")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Nuevo" } });
    fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Afiliado" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "nuevo@metafit.com" } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "999999" } });
    fireEvent.submit(screen.getByText("Crear afiliado").closest("form"));

    await waitFor(() =>
      expect(authAxiosMock.post).toHaveBeenCalledWith(
        "/afiliados",
        expect.objectContaining({ nombres: "Nuevo", estado_afiliacion: "Activo" })
      )
    );
    await waitFor(() =>
      expect(authAxiosMock.post).toHaveBeenCalledWith("/afiliados/3/restricciones", { id_restriccion: 7 })
    );
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Afiliado creado correctamente", "success"));
  });

  test("editar con error del servidor muestra el mensaje recibido", async () => {
    const axios = crearAxios();
    axios.patch.mockRejectedValue({ response: { data: { error: "Documento duplicado" } } });
    montar("Administrador", axios);
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    await screen.findByRole("heading", { name: /Editar: Ana Pérez/ });
    fireEvent.submit(screen.getByText("Guardar").closest("form"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Documento duplicado", "danger"));
  });

  test("eliminar: confirmación cancelada y error del backend", async () => {
    const axios = crearAxios();
    axios.delete.mockRejectedValue({ response: { data: { error: "No se puede eliminar" } } });
    montar("Administrador", axios);
    await screen.findByText("Ana Pérez");

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    expect(axios.delete).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("No se puede eliminar", "danger"));
    confirmSpy.mockRestore();
  });

  test("error de carga deja la tabla vacía; error de detalle avisa; filtro por documento", async () => {
    const axios = crearAxios();
    axios.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.reject(new Error("net"));
      return Promise.reject({ response: { data: { error: "boom" } } });
    });
    const primera = montar("Administrador", axios);

    expect(await screen.findByText("No se encontraron afiliados.")).toBeInTheDocument();
    primera.unmount();

    // Con datos: filtro por documento y error al abrir detalle
    const axios2 = crearAxios();
    axios2.get = vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: AFILIADOS });
      if (url.startsWith("/afiliados/")) return Promise.reject(new Error("net"));
      return Promise.resolve({ data: {} });
    });
    montar("Administrador", axios2);
    await screen.findByText("Ana Pérez");

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre, correo o documento..."), {
      target: { value: "654321" },
    });
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Error al cargar detalle del afiliado", "danger"));
  });

  test("Entrenador: ve progreso, no crea ni elimina; Recepcionista ve en solo lectura", async () => {
    const primera = montar("Entrenador");
    await screen.findByText("Ana Pérez");

    expect(screen.getByText("Seguimiento de afiliados asignados")).toBeInTheDocument();
    expect(screen.queryByText(/Nuevo afiliado/)).not.toBeInTheDocument();
    expect(screen.queryAllByTitle("Eliminar")).toHaveLength(0);
    expect(screen.getAllByTitle("Progreso").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Ana Pérez/ });
    expect(screen.getByText("add-restriccion")).toBeInTheDocument();
    expect(screen.queryByText("solo-lectura")).not.toBeInTheDocument();
    primera.unmount();

    montar("Recepcionista");
    await screen.findByText("Ana Pérez");
    expect(screen.getByText("Registro y consulta de afiliados")).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle("Ver")[0]);
    await screen.findByRole("heading", { name: /Ana Pérez/ });
    expect(screen.getByText("solo-lectura")).toBeInTheDocument();
    expect(screen.queryByText("add-restriccion")).not.toBeInTheDocument();
  });
});
