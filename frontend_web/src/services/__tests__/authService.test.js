import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../api";
import {
  AVAILABLE_ROLES,
  ROLE_REDIRECT_MAP,
  loginUser,
  solicitarRecuperacion,
  resetPasswordRequest,
  persistSession,
  clearSession,
  loadStoredUser,
  loadStoredToken,
  persistUserRole,
} from "../authService";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("authService", () => {
  test("expone roles y mapa de redirección", () => {
    expect(AVAILABLE_ROLES).toHaveLength(3);
    expect(ROLE_REDIRECT_MAP.Entrenador).toBe("/rutinas");
  });

  test("login y recuperación delegan en la API", async () => {
    api.post
      .mockResolvedValueOnce({ data: { accessToken: "jwt", user: { role: "Administrador" } } })
      .mockResolvedValueOnce({ data: { mensaje: "enviado" } })
      .mockResolvedValueOnce({ data: { mensaje: "actualizada" } });

    await expect(loginUser({ correo: "a@b.com", contrasena: "Clave123" }))
      .resolves.toEqual({ accessToken: "jwt", user: { role: "Administrador" } });
    expect(api.post).toHaveBeenNthCalledWith(1, "/login", {
      email: "a@b.com",
      password: "Clave123",
    });

    await expect(solicitarRecuperacion("a@b.com")).resolves.toEqual({ mensaje: "enviado" });
    expect(api.post).toHaveBeenNthCalledWith(2, "/auth/recuperar-password", {
      email: "a@b.com",
    });

    await expect(resetPasswordRequest("token", "Nueva123")).resolves.toEqual({
      mensaje: "actualizada",
    });
    expect(api.post).toHaveBeenNthCalledWith(3, "/auth/reset-password", {
      token: "token",
      nuevaPassword: "Nueva123",
    });
  });

  test("persiste, carga y limpia la sesión", () => {
    persistSession("jwt", { role: "Entrenador", nombres: "Ana" });
    expect(loadStoredToken()).toBe("jwt");
    expect(loadStoredUser()).toEqual({ role: "Entrenador", nombres: "Ana" });
    expect(localStorage.getItem("metafit_role")).toBe("Entrenador");

    localStorage.setItem("notif_vistas_7", "1");
    localStorage.setItem("otra_clave", "x");
    clearSession();
    expect(loadStoredToken()).toBeNull();
    expect(loadStoredUser()).toBeNull();
    expect(localStorage.getItem("notif_vistas_7")).toBeNull();
    expect(localStorage.getItem("otra_clave")).toBe("x");
  });

  test("descarta usuarios sin rol y JSON corrupto", () => {
    expect(loadStoredUser()).toBeNull();

    localStorage.setItem("metafit_user", JSON.stringify({ nombres: "Sin rol" }));
    expect(loadStoredUser()).toBeNull();
    expect(localStorage.getItem("metafit_user")).toBeNull();

    localStorage.setItem("metafit_user", "{json roto");
    expect(loadStoredUser()).toBeNull();
    expect(localStorage.getItem("metafit_user")).toBeNull();
  });

  test("persistUserRole guarda el rol o vacío", () => {
    persistUserRole("Administrador");
    expect(localStorage.getItem("metafit_role")).toBe("Administrador");
    persistUserRole();
    expect(localStorage.getItem("metafit_role")).toBe("");
  });
});
