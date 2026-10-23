import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AuthInput from "../AuthInput";

describe("<AuthInput />", () => {
  test("renderiza un campo normal y aplica estilos de foco/blur", () => {
    const onChange = vi.fn();
    render(
      <AuthInput
        id="correo"
        label="Correo"
        value="ana@metafit.com"
        onChange={onChange}
        placeholder="correo@metafit.com"
        required
      />
    );

    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "correo@metafit.com");
    expect(input).toBeRequired();

    fireEvent.focus(input);
    expect(input.style.borderColor).toBe("rgb(227, 28, 37)");
    expect(input.style.boxShadow).toContain("227,28,37");

    fireEvent.blur(input);
    expect(input.style.borderColor).toBe("rgba(255, 255, 255, 0.1)");
    expect(input.style.boxShadow).toBe("none");

    fireEvent.change(input, { target: { value: "nuevo@metafit.com" } });
    expect(onChange).toHaveBeenCalled();
  });

  test("renderiza el botón para mostrar/ocultar contraseña", () => {
    const onTogglePass = vi.fn();
    render(
      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        value="secreta"
        onChange={vi.fn()}
        password
        showPass
        onTogglePass={onTogglePass}
      />
    );

    const toggle = screen.getByRole("button", { name: "Ocultar contraseña" });
    fireEvent.click(toggle);
    expect(onTogglePass).toHaveBeenCalledTimes(1);
  });
});
