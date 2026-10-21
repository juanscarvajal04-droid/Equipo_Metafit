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
    useAuth.mockReturnValue({ authAxios: authAxiosMock });
    useToast.mockReturnValue({ showToast: vi.fn() });
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
});
