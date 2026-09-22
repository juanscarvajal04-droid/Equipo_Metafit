// ============================================================
// src/components/__tests__/RestriccionSelector.test.jsx
//
// Regresión BUG: "Nuevo Afiliado — restricciones no se agregan".
// Causa raíz: en modo registro, `selectedId` llega como string
// (e.target.value del <select>) pero `getId(r)` devuelve number
// (id_restriccion INT de MySQL). La comparación estricta `===`
// fallaba y el `find` devolvía undefined → onAdd nunca se llamaba.
// ============================================================
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import RestriccionSelector from "../common/RestriccionSelector";

vi.mock("../../services/restriccionService", async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, fetchRestricciones: vi.fn() };
});

import { fetchRestricciones } from "../../services/restriccionService";

const CATALOGO = [
  {
    id_restriccion: 3,
    nombre_restriccion: "Hipertensión",
    tipo: "Enfermedad",
    efecto_relevante: "Evitar esfuerzo máximo",
  },
  {
    id_restriccion: 7,
    nombre_restriccion: "Alergia a mariscos",
    tipo: "Alergia",
  },
];

// Wrapper que replica el estado del padre (AfiliadosView):
// handleAddRestriccionTemporal / handleRemoveRestriccionTemporal.
function WrapperRegistro() {
  const [asig, setAsig] = useState([]);
  return (
    <RestriccionSelector
      restriccionesAsignadas={asig}
      onAdd={(r) =>
        setAsig((p) =>
          p.some((x) => (x?.id_restriccion ?? x?.id) === (r?.id_restriccion ?? r?.id))
            ? p
            : [...p, r]
        )
      }
      onRemove={(id) =>
        setAsig((p) => p.filter((x) => (x?.id_restriccion ?? x?.id) !== id))
      }
      isRegistration
    />
  );
}

function abrirModalYCargarCatalogo() {
  fireEvent.click(screen.getByText("+ Agregar restricción"));
  return screen.findByRole("combobox");
}

function confirmarAgregado(valorSelect) {
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: valorSelect },
  });
  fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
}

describe("RestriccionSelector (modo registro)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchRestricciones.mockResolvedValue(CATALOGO);
  });

  test("agrega la restricción seleccionada a la lista (regresión string vs number)", async () => {
    render(<WrapperRegistro />);

    expect(screen.getByText("Sin restricciones registradas")).toBeInTheDocument();

    await abrirModalYCargarCatalogo();
    confirmarAgregado("3"); // value del <select> siempre es string

    // La restricción queda visible como badge en la lista del registro
    expect(await screen.findByText(/Hipertensión/)).toBeInTheDocument();
    expect(screen.queryByText("Sin restricciones registradas")).not.toBeInTheDocument();
    expect(fetchRestricciones).toHaveBeenCalledTimes(1);
  });

  test("onAdd recibe el objeto completo del catálogo en modo registro", async () => {
    const onAdd = vi.fn();
    render(
      <RestriccionSelector
        restriccionesAsignadas={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        isRegistration
      />
    );

    await abrirModalYCargarCatalogo();
    confirmarAgregado("7");

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith(CATALOGO[1]);
  });

  test("en modo edición (sin isRegistration) pasa el id seleccionado al callback", async () => {
    const onAdd = vi.fn().mockResolvedValue({ message: "ok" });
    render(
      <RestriccionSelector
        restriccionesAsignadas={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );

    await abrirModalYCargarCatalogo();
    confirmarAgregado("3");

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith("3");
  });
});