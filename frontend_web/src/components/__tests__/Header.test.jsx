// frontend_web/src/components/__tests__/Header.test.jsx
// Cubre el avatar del staff, el modal de foto y la subida a /usuarios/me/foto.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Header from "../Header";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));

const updateUser = vi.fn();
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
});
