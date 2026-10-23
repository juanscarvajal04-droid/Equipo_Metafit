// frontend_web/src/views/__tests__/PagosView.test.jsx
// Smoke test de pagos: KPIs de membresía, búsqueda, registro e historial.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import PagosView from "../PagosView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useToast", () => ({ useToast: vi.fn() }));
vi.mock("../../components/AppLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const AFILIADOS = [
  {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@metafit.com",
    fecha_vencimiento: "2026-12-01",
    pagos: [
      {
        id_pago: 10,
        fecha_pago: "2026-10-01",
        valor_pagado: 80000,
        estado: "Pagado",
        nombres_recepcionista: "Rita",
        apellidos_recepcionista: "López",
      },
    ],
  },
  {
    id_usuario: 2,
    nombres: "Luis",
    apellidos: "Gómez",
    correo: "luis@metafit.com",
    fecha_vencimiento: "2026-10-25",
    pagos: [],
  },
  {
    id_usuario: 3,
    nombres: "Marta",
    apellidos: "Ruiz",
    correo: "marta@metafit.com",
    fecha_vencimiento: "2026-09-01",
    pagos: [],
  },
  {
    id_usuario: 4,
    nombres: "Sin",
    apellidos: "Registro",
    correo: "sin@metafit.com",
    fecha_vencimiento: null,
    pagos: [],
  },
];

let authAxiosMock;
let showToastMock;

function crearAuthAxios() {
  return {
    get: vi.fn((url) => {
      if (url === "/afiliados") return Promise.resolve({ data: AFILIADOS });
      if (url.endsWith("/pagos")) {
        return Promise.resolve({
          data: [
            {
              id_pago: 10,
              fecha_pago: "2026-10-01",
              valor_pagado: 80000,
              estado: "Pagado",
              nombres_recepcionista: "Rita",
              apellidos_recepcionista: "López",
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

function renderView() {
  return render(
    <MemoryRouter>
      <PagosView />
    </MemoryRouter>
  );
}

describe("PagosView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAxiosMock = crearAuthAxios();
    showToastMock = vi.fn();
    useAuth.mockReturnValue({ authAxios: authAxiosMock });
    useToast.mockReturnValue({ showToast: showToastMock });
  });

  test("muestra estados, busca y registra pago e historial", async () => {
    renderView();

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Marta Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Sin Registro")).toBeInTheDocument();
    expect(screen.getAllByText("Al día").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Por vencer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vencido").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin registro").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre..."), {
      target: { value: "Ana" },
    });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre..."), {
      target: { value: "" },
    });

    fireEvent.click(screen.getAllByTitle("Registrar pago")[0]);
    expect(
      await screen.findByRole("heading", { name: "Registrar Pago en Efectivo" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Confirmar Pago/));
    await waitFor(() =>
      expect(authAxiosMock.post).toHaveBeenCalledWith("/afiliados/1/pagos", {
        valor: 80000,
      })
    );

    fireEvent.click(screen.getAllByTitle("Ver historial")[0]);
    expect(
      await screen.findByRole("heading", { name: "Historial de pagos" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Rita López")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cerrar"));
  });

  test("registra el error de carga de afiliados", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authAxiosMock.get.mockRejectedValueOnce(new Error("red caída"));

    renderView();
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("[PagosView]", expect.any(Error))
    );
    errorSpy.mockRestore();
  });

  test("cierra el modal de pago de tres formas y muestra el error al registrar", async () => {
    renderView();
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Registrar pago")[0]);
    await screen.findByRole("heading", { name: "Registrar Pago en Efectivo" });
    fireEvent.keyDown(screen.getByLabelText("Cerrar modal de pago"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Registrar Pago en Efectivo" })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Registrar pago")[0]);
    await screen.findByRole("heading", { name: "Registrar Pago en Efectivo" });
    fireEvent.click(screen.getByText("✕"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Registrar Pago en Efectivo" })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Registrar pago")[0]);
    await screen.findByRole("heading", { name: "Registrar Pago en Efectivo" });
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Registrar Pago en Efectivo" })
      ).not.toBeInTheDocument()
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authAxiosMock.post.mockRejectedValueOnce({
      response: { data: { message: "Saldo insuficiente" } },
    });
    fireEvent.click(screen.getAllByTitle("Registrar pago")[0]);
    await screen.findByRole("heading", { name: "Registrar Pago en Efectivo" });
    fireEvent.click(screen.getByText(/Confirmar Pago/));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("Saldo insuficiente", "error")
    );
    errorSpy.mockRestore();
  });

  test("cierra el historial con Escape y X, y avisa si falla la carga", async () => {
    renderView();
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getAllByTitle("Ver historial")[0]);
    await screen.findByRole("heading", { name: "Historial de pagos" });
    fireEvent.keyDown(screen.getByLabelText("Cerrar historial de pagos"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Historial de pagos" })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getAllByTitle("Ver historial")[0]);
    await screen.findByRole("heading", { name: "Historial de pagos" });
    fireEvent.click(screen.getByText("✕"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Historial de pagos" })
      ).not.toBeInTheDocument()
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authAxiosMock.get.mockRejectedValueOnce(new Error("historial caído"));
    fireEvent.click(screen.getAllByTitle("Ver historial")[0]);
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Error al cargar historial",
        "error"
      )
    );
    errorSpy.mockRestore();
  });
});
