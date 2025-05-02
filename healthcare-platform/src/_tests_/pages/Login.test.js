// src/__tests__/pages/Login.test.js

// 1) Mock authService & api so axios never loads
jest.mock("../../services/authService");
jest.mock("../../services/api", () => ({}));

// 2) Set up a fake window.alert and mutable location.href
beforeAll(() => {
  global.alert = jest.fn();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { href: "" },
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../pages/Login";
import * as authService from "../../services/authService";

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset location for each test
    window.location.href = "";
  });

  it("renders email & password inputs and submit button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("alerts on failed login", async () => {
    authService.loginUser.mockRejectedValue(new Error("Invalid credentials"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@user.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "badpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith(
        "Login failed: Invalid credentials"
      )
    );
    // location should remain unchanged
    expect(window.location.href).toBe("");
  });

  it("alerts then redirects on successful login", async () => {
    authService.loginUser.mockResolvedValue({ token: "t", role: "patient" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@domain.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "goodpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // First you should see the success alert
    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith("Login successful!")
    );
    // Then the component does a hard redirect
    expect(window.location.href).toBe("/dashboard");
  });
});
