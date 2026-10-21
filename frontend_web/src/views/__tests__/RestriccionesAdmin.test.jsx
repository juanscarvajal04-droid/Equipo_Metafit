// frontend_web/src/views/__tests__/RestriccionesAdmin.test.jsx
// Smoke test del catálogo de restricciones: listado, búsqueda y CRUD.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import RestriccionesAdmin from "../RestriccionesAdmin";
import {
  fetchRestricciones,
  crearRestriccion,
  actualizarRestriccion,
  eliminarRestriccion,
} from "../../services/restriccionService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../services/restriccionService", () => ({
  fetchRestricciones: vi.fn(),
  crearRestriccion: vi.fn(),
  actualizarRestriccion: vi.fn(),
  eliminarRestriccion: vi.fn(),
  TIPOS_RESTRICCION: ["Enfermedad", "Lesion", "Alergia", "Medicamento", "Otra"],
  TIPO_ICONO: {
    Enfermedad: "E",
    Lesion: "L",
    Alergia: "A",
    Medicamento: "M",
    Otra: "O",
  },
  FORM_RESTRICCION_VACIO: {
    nombre_restriccion: "",
    tipo: "Enfermedad",
    efecto_relevante: "",
  },
}));

const RESTRICCIONES = [
  {
    id_restriccion: 1,
    nombre_restriccion: "Asma",
    tipo: "Enfermedad",
    efecto_relevante: "Evitar alta intensidad",
  },
  {
    id_restriccion: 2,
    nombre_restriccion: "Lactosa",
    tipo: "Alergia",
    efecto_relevante: "",
  },
];

function renderView() {
  return render(
    <MemoryRouter>
      <RestriccionesAdmin />
    </MemoryRouter>
  );
}

describe("RestriccionesAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchRestricciones.mockResolvedValue(RESTRICCIONES);
    crearRestriccion.mockResolvedValue({ id: 3 });
    actualizarRestriccion.mockResolvedValue({ message: "ok" });
    eliminarRestriccion.mockResolvedValue({ message: "ok" });
    useAuth.mockReturnValue({ user: { role: "Administrador" } });
    useToast.mockReturnValue({ toast: {}, showToast: vi.fn() });
  });

  test("lista, busca y ejecuta crear, editar y eliminar", async () => {
    renderView();

    expect(await screen.findByText(/Asma/)).toBeInTheDocument();
    expect(screen.getByText(/Lactosa/)).toBeInTheDocument();
    expect(screen.getByText("Enfermedad")).toBeInTheDocument();
    expect(screen.getByText("Alergia")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre o tipo..."), {
      target: { value: "Asma" },
    });
    expect(screen.getByText(/Asma/)).toBeInTheDocument();
    expect(screen.queryByText(/Lactosa/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre o tipo..."), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByText(/Nueva restricción/));
    expect(
      await screen.findByRole("heading", { name: /Nueva restricción/ })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ej: Asma"), {
      target: { value: "Gluten" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Alergia" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Evitar esfuerzos/), {
      target: { value: "Evitar trigo" },
    });
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() =>
      expect(crearRestriccion).toHaveBeenCalledWith(
        expect.objectContaining({ nombre_restriccion: "Gluten", tipo: "Alergia" })
      )
    );

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    expect(
      await screen.findByRole("heading", { name: /Editar restricción/ })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Asma"), {
      target: { value: "Asma controlada" },
    });
    fireEvent.click(screen.getByText("Actualizar"));
    await waitFor(() =>
      expect(actualizarRestriccion).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre_restriccion: "Asma controlada" })
      )
    );

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);
    await waitFor(() => expect(eliminarRestriccion).toHaveBeenCalledWith(1));
  });

  test("cierra el modal con click en el overlay y con Escape", async () => {
    renderView();
    await screen.findByText(/Asma/);

    fireEvent.click(screen.getByText(/Nueva restricción/));
    await screen.findByRole("heading", { name: /Nueva restricción/ });
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Nueva restricción/ })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/Nueva restricción/));
    const overlay = await screen.findByLabelText("Cerrar modal");
    fireEvent.keyDown(overlay, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Nueva restricción/ })
      ).not.toBeInTheDocument()
    );
  });
});
