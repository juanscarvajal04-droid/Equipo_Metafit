// frontend_web/src/components/__tests__/AppLayout.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

vi.mock("../Sidebar", () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock("../Header", () => ({ default: () => <div data-testid="header" /> }));
vi.mock("../Footer", () => ({ default: () => <div data-testid="footer" /> }));

import AppLayout from "../AppLayout";

describe("AppLayout", () => {
  test("compone sidebar, header, contenido y footer", () => {
    render(
      <AppLayout>
        <p>contenido de la vista</p>
      </AppLayout>
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("contenido de la vista")).toBeInTheDocument();
  });
});
