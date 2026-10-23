// frontend_web/src/views/__tests__/GestionPersonal.test.jsx
// Smoke test del CRUD de personal: tabla, búsqueda, creación, edición y borrado.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import GestionPersonal from "../GestionPersonal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const PERSONAL = [
  {
    id_usuario: 99,
    nombres: "Root",
    apellidos: "Admin",
    correo: "root@metafit.com",
    rol: "admin",
    estado: "activo",
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    rol: "recepcionista",
    estado: "inactivo",
  },
  {
    id_usuario: 3,
    nombres: "Marta",
    apellidos: "Ruiz",
    correo: "marta@metafit.com",
    rol: "entrenador",
    estado: "pendiente",
  },
];

let authAxiosMock;
let showToastMock;

function crearAuthAxios() {
  return {
    get: vi.fn().mockResolvedValue({ data: PERSONAL }),
    post: vi.fn().mockResolvedValue({ data: { id: 4 } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView() {
  return render(
    <MemoryRouter>
      <GestionPersonal />
    </MemoryRouter>
  );
}

describe("GestionPersonal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = crearAuthAxios();
    showToastMock = vi.fn();
    useAuth.mockReturnValue({
      user: { id_usuario: 99, role: "Administrador" },
      authAxios: authAxiosMock,
    });
    useToast.mockReturnValue({ toast: {}, showToast: showToastMock });
  });

  test("renderiza la tabla y cubre creación, edición y eliminación", async () => {
    renderView();

    expect(await screen.findByText("Root Admin")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Marta Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Recepcionista")).toBeInTheDocument();
    expect(screen.getByText("Entrenador")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar por nombre/), {
      target: { value: "recepcionista" },
    });
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Marta Ruiz")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Buscar por nombre/), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByText(/Nuevo empleado/));
    expect(await screen.findByRole("heading", { name: /Nuevo empleado/ })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Nombres"), { target: { value: "Nuevo" } });
    fireEvent.change(screen.getByPlaceholderText("Apellidos"), { target: { value: "Empleado" } });
    fireEvent.change(screen.getByPlaceholderText("correo@ejemplo.com"), {
      target: { value: "nuevo@metafit.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByPlaceholderText("Contraseña").parentElement.querySelector("button"));
    fireEvent.change(screen.getByDisplayValue("Recepcionista"), { target: { value: "Entrenador" } });
    fireEvent.change(screen.getByDisplayValue("Activo"), { target: { value: "Pendiente" } });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(authAxiosMock.post).toHaveBeenCalledWith(
        "/usuarios",
        expect.objectContaining({
          nombres: "Nuevo",
          email: "nuevo@metafit.com",
          rol: "Entrenador",
        })
      )
    );

    fireEvent.click(screen.getAllByTitle("Editar")[1]);
    expect(await screen.findByRole("heading", { name: /Editar empleado/ })).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Luis"), { target: { value: "Luis Editado" } });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(authAxiosMock.patch).toHaveBeenCalledWith(
        "/usuarios/2",
        expect.objectContaining({ nombres: "Luis Editado" })
      )
    );

    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);
    expect(await screen.findByRole("heading", { name: /Eliminar empleado/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Sí, eliminar/));
    await waitFor(() => expect(authAxiosMock.delete).toHaveBeenCalledWith("/usuarios/3"));
  });

  test("muestra el error cuando falla la carga de personal", async () => {
    authAxiosMock.get.mockRejectedValueOnce({
      response: { data: { error: "No autorizado" } },
    });
    useAuth.mockReturnValue({
      user: { id_usuario: 99, role: "Administrador" },
      authAxios: authAxiosMock,
    });
    renderView();
    expect(await screen.findByText(/No autorizado/)).toBeInTheDocument();
  });

  test("valida el formulario de creación y muestra el error del backend", async () => {
    renderView();
    await screen.findByText("Root Admin");

    fireEvent.click(screen.getByText(/Nuevo empleado/));
    const form = screen.getByText("Guardar").closest("form");
    fireEvent.submit(form);
    expect(showToastMock).toHaveBeenCalledWith("El correo es obligatorio", "danger");

    fireEvent.change(screen.getByPlaceholderText("correo@ejemplo.com"), {
      target: { value: "nuevo@metafit.com" },
    });
    fireEvent.submit(form);
    expect(showToastMock).toHaveBeenCalledWith(
      "La contraseña es obligatoria",
      "danger"
    );

    authAxiosMock.post.mockRejectedValueOnce({
      response: { data: { error: "Correo duplicado" } },
    });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("Correo duplicado", "danger")
    );
  });

  test("valida la edición, informa errores y cierra con teclado", async () => {
    renderView();
    await screen.findByText("Root Admin");

    fireEvent.click(screen.getAllByTitle("Editar")[1]);
    await screen.findByRole("heading", { name: /Editar empleado/ });

    fireEvent.change(screen.getByDisplayValue("luis@metafit.com"), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByText("Guardar").closest("form"));
    expect(showToastMock).toHaveBeenCalledWith("El correo es obligatorio", "danger");

    fireEvent.change(screen.getByPlaceholderText("correo@ejemplo.com"), {
      target: { value: "luis@metafit.com" },
    });
    authAxiosMock.patch.mockRejectedValueOnce({
      response: { data: { error: "No se pudo actualizar" } },
    });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("No se pudo actualizar", "danger")
    );

    fireEvent.keyDown(screen.getByLabelText("Cerrar modal de empleado"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Editar empleado/ })
      ).not.toBeInTheDocument()
    );
  });

  test("cubre las formas de cerrar el modal de eliminación y su error", async () => {
    renderView();
    await screen.findByText("Root Admin");

    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);
    await screen.findByRole("heading", { name: /Eliminar empleado/ });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal de eliminación"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Eliminar empleado/ })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);
    await screen.findByRole("heading", { name: /Eliminar empleado/ });
    fireEvent.click(screen.getByText("✕"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Eliminar empleado/ })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);
    await screen.findByRole("heading", { name: /Eliminar empleado/ });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Eliminar empleado/ })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);
    await screen.findByRole("heading", { name: /Eliminar empleado/ });
    authAxiosMock.delete.mockRejectedValueOnce({
      response: { data: { error: "No se pudo eliminar" } },
    });
    fireEvent.click(screen.getByText(/Sí, eliminar/));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("No se pudo eliminar", "danger")
    );
  });
});
