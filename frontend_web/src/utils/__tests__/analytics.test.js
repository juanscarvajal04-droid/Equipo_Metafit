// frontend_web/src/utils/__tests__/analytics.test.js
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { trackEvent } from "../analytics";

describe("analytics.trackEvent", () => {
  beforeEach(() => {
    delete window.dataLayer;
  });

  afterEach(() => {
    delete window.dataLayer;
    vi.restoreAllMocks();
  });

  test("no falla si no existe dataLayer", () => {
    expect(() => trackEvent("metaFit_test")).not.toThrow();
  });

  test("hace push del evento con parámetros", () => {
    window.dataLayer = [];
    trackEvent("metaFit_afiliado_creado", { id: 1 });
    expect(window.dataLayer).toEqual([{ event: "metaFit_afiliado_creado", id: 1 }]);
  });

  test("si dataLayer no es array no hace push", () => {
    window.dataLayer = "no-array";
    expect(() => trackEvent("x")).not.toThrow();
  });

  test("un fallo de push no rompe la app", () => {
    const dl = [];
    dl.push = () => { throw new Error("bloqueado"); };
    window.dataLayer = dl;
    expect(() => trackEvent("x")).not.toThrow();
  });
});
