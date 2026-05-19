/**
 * Smoke test that proves the test rig is wired up correctly.
 * Once richer tests land, this file becomes the test for the
 * shared <JuicyButton /> primitive.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const Hello = ({ name }) => <p data-testid="greet">Hello, {name}!</p>;

describe("test setup smoke", () => {
    it("renders a component", () => {
        render(<Hello name="Kiddo" />);
        expect(screen.getByTestId("greet")).toHaveTextContent("Hello, Kiddo!");
    });

    it("has matchMedia and AudioContext stubs", () => {
        expect(typeof window.matchMedia).toBe("function");
        expect(typeof window.AudioContext).toBe("function");
    });
});
