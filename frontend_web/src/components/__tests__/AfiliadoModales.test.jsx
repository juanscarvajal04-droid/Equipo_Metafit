// frontend_web/src/components/__tests__/AfiliadoModales.test.jsx
// Tests de los 3 modales de afiliado: crear, editar y ver (tabs por rol).
import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AfiliadoCrearModal from "../AfiliadoCrearModal";
import AfiliadoEditModal from "../AfiliadoEditModal";
import AfiliadoVerModal from "../AfiliadoVerModal";

const FORM_BASE = {
  nombres: "Ana",
  apellidos: "Pérez",
  correo: "ana@metafit.com",
  telefono: "3001234567",
  direccion: "Calle 1",
  documento: "123456",
  fecha_nacimiento: "1995-04-12",
  sexo: "Femenino",
  estatura_cm: "165",
  objetivo_fisico: "Pérdida de grasa",
  grupo_muscular_prioritario: "Piernas",
  nivel_experiencia: "Intermedio",
  disponibilidad_semanal_dias: 4,
  estado: "Activo",
  plan_membresia: "Premium",
  restricciones_medicas: "Asma",
};

function HarnessCrear({ savingNew = false, newError = "" }) {
  const [form, setForm] = useState(FORM_BASE);
  const [abierto, setAbierto] = useState(true);
  const onSubmit = vi.fn((e) => e.preventDefault());
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>reabrir</button>
      <AfiliadoCrearModal
        crearModal={abierto}
        formNuevo={form}
        setFormNuevo={setForm}
        savingNew={savingNew}
        newError={newError}
        onSubmit={onSubmit}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}

function HarnessEditar({ savingEdit = false, editError = "" }) {
  const [form, setForm] = useState(FORM_BASE);
  const [abierto, setAbierto] = useState(true);
  const onSave = vi.fn((e) => e.preventDefault());
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>reabrir</button>
      <AfiliadoEditModal
        editModal={abierto ? FORM_BASE : null}
        formEdit={form}
        setFormEdit={setForm}
        savingEdit={savingEdit}
        editError={editError}
        onSave={onSave}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}

const AFILIADO_COMPLETO = {
  id_usuario: 1,
  nombres: "Ana",
  apellidos: "Pérez",
  correo: "ana@metafit.com",
  telefono: "3001234567",
  documento: "123456",
  sexo: "Femenino",
  fecha_nacimiento: "1995-04-12",
  fecha_registro: "2025-01-10",
  estatura_cm: 165,
  objetivo_fisico: "Perdida de grasa",
  nivel_experiencia: "Intermedio",
  disponibilidad_semanal_dias: 4,
  plan_membresia: "Premium",
  estado: "Activo",
  restricciones: [
    { id_restriccion: 1, nombre: "Asma", tipo: "Enfermedad", efecto_relevante: "Evitar cardio extremo" },
  ],
  ciclo_activo: {
    numero_ciclo: 3,
    fecha_inicio: "2026-10-01",
    fecha_fin: "2026-10-31",
    progreso_fisico: [
      {
        fecha_registro: "2026-10-15",
        peso_kg: 70,
        porcentaje_grasa: 18,
        medidas_cm: { cintura: 80, brazo: 32, pierna: 56 },
        observaciones: "Buen avance",
      },
    ],
    plan_nutricional: { calorias_estimadas: 2000, num_comidas_diarias: 4 },
    plan_entrenamiento: {
      rutinas: [
        {
          dia_numero: 1,
          nombre: "Piernas",
          ejercicios: [{ nombre: "Sentadilla", series: 4, repeticiones: 12 }],
        },
      ],
    },
  },
};

describe("AfiliadoCrearModal", () => {
  test("no renderiza nada si crearModal es false", () => {
    const { container } = render(
      <AfiliadoCrearModal
        crearModal={false}
        formNuevo={FORM_BASE}
        setFormNuevo={vi.fn()}
        savingNew={false}
        newError=""
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("cambia los campos, envía el formulario y cancela con Escape/Enter", () => {
    render(<HarnessCrear newError="Correo duplicado" />);

    expect(screen.getByText("➕ Nuevo Afiliado")).toBeInTheDocument();
    expect(screen.getByText(/Correo duplicado/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Ana María" } });
    fireEvent.change(screen.getByLabelText("Estatura (cm)"), { target: { value: "170" } });
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "Calle 2" } });
    fireEvent.change(screen.getByLabelText("Sexo"), { target: { value: "Otro" } });
    fireEvent.change(screen.getByLabelText("Plan *"), { target: { value: "VIP" } });
    fireEvent.change(screen.getByLabelText("Estado inicial"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Objetivo físico"), { target: { value: "Mantenimiento" } });
    fireEvent.change(screen.getByLabelText("Nivel"), { target: { value: "Avanzado" } });
    fireEvent.change(screen.getByLabelText("Músculo prioritario"), { target: { value: "Pecho" } });
    fireEvent.change(screen.getByLabelText("Días disponibles/sem"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/Restricciones médicas/), { target: { value: "Diabetes" } });

    fireEvent.click(screen.getByText("✅ Crear afiliado"));
    expect(screen.getByText("✅ Crear afiliado")).toBeInTheDocument();

    // Escape sobre el overlay cierra
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar modal de nuevo afiliado" }), { key: "Escape" });
    expect(screen.queryByText("➕ Nuevo Afiliado")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("reabrir"));
    expect(screen.getByText("➕ Nuevo Afiliado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal de nuevo afiliado" }));
    expect(screen.queryByText("➕ Nuevo Afiliado")).not.toBeInTheDocument();
  });

  test("con savingNew muestra spinner y no permite cerrar", () => {
    render(<HarnessCrear savingNew />);
    expect(screen.getByText("Guardando...")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar modal de nuevo afiliado" }), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal de nuevo afiliado" }));
    expect(screen.getByText("➕ Nuevo Afiliado")).toBeInTheDocument();
  });
});

describe("AfiliadoEditModal", () => {
  test("no renderiza nada sin editModal", () => {
    const { container } = render(
      <AfiliadoEditModal
        editModal={null}
        formEdit={FORM_BASE}
        setFormEdit={vi.fn()}
        savingEdit={false}
        editError=""
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("cambia campos, guarda y cancela", () => {
    render(<HarnessEditar editError="Documento ya existe" />);

    expect(screen.getByText(/Editar — Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText(/Documento ya existe/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana M" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "nuevo@metafit.com" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "Inactivo" } });
    fireEvent.change(screen.getByLabelText("Plan membresía"), { target: { value: "VIP" } });
    fireEvent.change(screen.getByLabelText("Objetivo físico"), { target: { value: "Mantenimiento" } });
    fireEvent.change(screen.getByLabelText("Nivel"), { target: { value: "Avanzado" } });

    fireEvent.click(screen.getByText("💾 Guardar"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText(/Editar — Ana Pérez/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("reabrir"));
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar modal de edición de afiliado" }), { key: "Escape" });
    expect(screen.queryByText(/Editar — Ana Pérez/)).not.toBeInTheDocument();
  });

  test("con savingEdit bloquea el cierre", () => {
    render(<HarnessEditar savingEdit />);
    expect(screen.getByText("Guardando...")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar modal de edición de afiliado" }), { key: "Escape" });
    expect(screen.getByText(/Editar — Ana Pérez/)).toBeInTheDocument();
  });

  test("cierra con el botón X del encabezado", () => {
    render(<HarnessEditar />);
    const cerrar = document.querySelector(".btn-close");
    fireEvent.click(cerrar);
    expect(screen.queryByText(/Editar — Ana Pérez/)).not.toBeInTheDocument();
  });
});

describe("AfiliadoVerModal", () => {
  test("no renderiza nada sin afiliado", () => {
    const { container } = render(
      <AfiliadoVerModal afiliado={null} role="Administrador" onClose={vi.fn()} onEdit={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("rol Administrador: tabs de cuenta, progreso y ciclo, restricciones y editar", () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(
      <AfiliadoVerModal
        afiliado={AFILIADO_COMPLETO}
        role="Administrador"
        onClose={onClose}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText("👤 Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Estado de Cuenta")).toBeInTheDocument();
    expect(screen.getByText("Progreso Físico")).toBeInTheDocument();
    expect(screen.getByText("Ciclo Activo")).toBeInTheDocument();
    expect(screen.getByText("Asma")).toBeInTheDocument();
    expect(screen.getByText("Evitar cardio extremo")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Progreso Físico"));
    expect(screen.getByText("70 kg")).toBeInTheDocument();
    expect(screen.getByText(/Buen avance/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ciclo Activo"));
    expect(screen.getByText(/Ciclo 3/)).toBeInTheDocument();
    expect(screen.getByText(/Plan Nutricional/)).toBeInTheDocument();
    expect(screen.getByText("Sentadilla")).toBeInTheDocument();
    expect(screen.getByText("4×12")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✏️ Editar"));
    expect(onClose).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalledWith(AFILIADO_COMPLETO);
  });

  test("rol Entrenador: sin botón editar y progreso vacío; cierra con overlay", () => {
    const onClose = vi.fn();
    render(
      <AfiliadoVerModal
        afiliado={{ ...AFILIADO_COMPLETO, ciclo_activo: null }}
        role="Entrenador"
        onClose={onClose}
        onEdit={vi.fn()}
      />
    );

    expect(screen.queryByText("Estado de Cuenta")).not.toBeInTheDocument();
    expect(screen.queryByText("✏️ Editar")).not.toBeInTheDocument();
    expect(screen.getByText(/Sin registros de progreso/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ciclo Activo"));
    expect(screen.getByText("Sin ciclo activo.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal de afiliado" }));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("rol Recepcionista: solo Estado de Cuenta con badge por estado", () => {
    render(
      <AfiliadoVerModal
        afiliado={{ ...AFILIADO_COMPLETO, estado: "pendiente", restricciones: [] }}
        role="Recepcionista"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    const dialog = screen.getByText("👤 Ana Pérez").closest(".modal-dialog");
    expect(within(dialog).getByText("pendiente")).toBeInTheDocument();
    expect(screen.queryByText("Progreso Físico")).not.toBeInTheDocument();
  });
});
