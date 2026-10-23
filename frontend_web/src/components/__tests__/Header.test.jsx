// frontend_web/src/components/__tests__/Header.test.jsx
// Cubre el avatar del staff, el modal de foto y la subida a /usuarios/me/foto.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Header from "../Header";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

const updateUser = vi.fn();
const switchRole = vi.fn();
const get = vi.fn();
const post = vi.fn();

function authAxios() {
  return { get, post };
}

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe("<Header />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: [] });
    useAuth.mockReturnValue({
      user: { id: 2, nombres: "Laura", apellidos: "Gómez", role: "Entrenador", foto: null },
      authAxios: authAxios(),
      updateUser,
      switchRole,
    });
  });

  test("abre el modal, selecciona una imagen y actualiza la foto", async () => {
    post.mockResolvedValue({ data: { foto: "/uploads/laura.png", url: "http://api.test/uploads/laura.png" } });
    renderHeader();

    expect(screen.getByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.getByText("Entrenador")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
    expect(screen.getByRole("dialog", { name: "Cambiar foto de perfil" })).toBeInTheDocument();

    const archivo = new File(["foto"], "laura.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [archivo] },
    });
    expect(screen.getByText("laura.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar foto" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/usuarios/me/foto", expect.any(FormData))
    );
    expect(updateUser).toHaveBeenCalledWith({ foto: "/uploads/laura.png" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test("muestra la foto actual y el error si la subida falla", async () => {
    useAuth.mockReturnValue({
      user: {
        id: 2,
        nombres: "Laura",
        apellidos: "Gómez",
        role: "Entrenador",
        foto: "https://cdn.test/laura.jpg",
      },
      authAxios: authAxios(),
      updateUser,
    });
    post.mockRejectedValueOnce({ response: { data: { error: "Solo se permiten imágenes" } } });
    renderHeader();

    expect(screen.getByAltText("Foto de perfil de Laura Gómez")).toHaveAttribute(
      "src",
      "https://cdn.test/laura.jpg"
    );

    fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
    expect(screen.getByAltText("Vista previa de la foto de perfil")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [new File(["foto"], "laura.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar foto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Solo se permiten imágenes");
    expect(updateUser).not.toHaveBeenCalled();
  });

  test("gestiona notificaciones, tema y clics fuera de los menús", async () => {
    get.mockResolvedValue({
      data: [
        { tipo: "pagos", icono: "💳", mensaje: "Pago pendiente", cantidad: 2, ruta: "/pagos" },
        { tipo: "stock", icono: "📦", mensaje: "Sin novedades", cantidad: 0 },
      ],
    });
    renderHeader();

    await waitFor(() => expect(get).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle("Notificaciones"));
    expect(await screen.findByText("Pago pendiente")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Cambiar tema (claro/oscuro)"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    fireEvent.click(screen.getByTitle("Cambiar tema (claro/oscuro)"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
    expect(localStorage.getItem("notif_vistas_2")).toContain("total");

    fireEvent.click(screen.getByText("Pago pendiente"));
    expect(screen.queryByText("Pago pendiente")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.keyDown(screen.getByText("Pago pendiente"), { key: "Enter" });
    expect(screen.queryByText("Pago pendiente")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Pago pendiente")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cambiar rol/ }));
    expect(screen.getByRole("menu", { name: "Cambiar rol" })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu", { name: "Cambiar rol" })).not.toBeInTheDocument();
  });

  test("cancela el polling de notificaciones ante un 401", async () => {
    get.mockRejectedValue({ response: { status: 401 } });
    renderHeader();

    await waitFor(() => expect(get).toHaveBeenCalled());
  });

  test("cambia de rol, valida credenciales y traduce errores del backend", async () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: /Cambiar rol/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar a Administrador/ }));
    expect(screen.getByRole("dialog", { name: /Cambiar a Administrador/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña del nuevo rol" }));
    expect(screen.getByRole("button", { name: "Ocultar contraseña del nuevo rol" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresá el correo y la contraseña del nuevo rol."
    );

    fireEvent.change(screen.getByLabelText("Correo del nuevo rol"), {
      target: { value: "admin@metafit.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña del nuevo rol"), {
      target: { value: "Clave123" },
    });

    switchRole.mockRejectedValueOnce({ response: { status: 400 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");

    switchRole.mockRejectedValueOnce({ response: { status: 403 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La cuenta no está activa. Contactá al administrador."
    );

    switchRole.mockRejectedValueOnce({ response: { status: 503 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El servidor no está disponible. Intentá nuevamente."
    );

    switchRole.mockRejectedValueOnce(new Error("Fallo personalizado"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Fallo personalizado");

    switchRole.mockRejectedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cambiar de rol. Intentá nuevamente."
    );

    switchRole.mockResolvedValueOnce({ role: "Administrador" });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio" }));
    await waitFor(() =>
      expect(switchRole).toHaveBeenCalledWith("admin@metafit.com", "Clave123", "Administrador")
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Cambiar rol/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar a Recepcionista/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cambiar rol/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar a Administrador/ }));
    fireEvent.click(screen.getAllByLabelText("Cerrar modal de cambio de rol")[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cambiar rol/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar a Administrador/ }));
    fireEvent.keyDown(screen.getAllByLabelText("Cerrar modal de cambio de rol")[0], {
      key: "Escape",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("previsualiza y descarta imágenes, y cierra el modal por overlay o Escape", () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:foto");
    URL.revokeObjectURL = vi.fn();

    try {
      renderHeader();
      fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));

      fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
        target: { files: [new File(["foto"], "uno.png", { type: "image/png" })] },
      });
      fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
        target: { files: [new File(["foto"], "dos.png", { type: "image/png" })] },
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto");

      fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
        target: { files: [] },
      });
      expect(screen.queryByText("dos.png")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
      fireEvent.click(screen.getAllByLabelText("Cerrar modal de foto")[0]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
      fireEvent.keyDown(screen.getAllByLabelText("Cerrar modal de foto")[0], { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
      fireEvent.click(screen.getByText("✕"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
