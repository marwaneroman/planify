/**
 * Integration tests for Auth page (forms, login/register toggle, API mocking)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auth from "./Auth";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    setSession: vi.fn(),
  })),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { apiFetch } from "@/lib/apiClient";

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

function renderAuth() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({});
  });

  it("renders login form by default", () => {
    renderAuth();
    const loginHeading = screen.getByRole("heading", { name: /welcome back/i });
    expect(loginHeading).toBeInTheDocument();
    const loginCard = loginHeading.closest(".flip-face");
    expect(loginCard).toBeInTheDocument();
    const loginForm = loginCard!.querySelector("form") as HTMLFormElement;
    expect(loginForm).toBeInTheDocument();
    expect(within(loginForm).getByLabelText(/email/i)).toBeInTheDocument();
    expect(within(loginForm).getByPlaceholderText(/your password/i)).toBeInTheDocument();
    expect(within(loginForm).getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("toggles to sign up form when clicking Sign up link", async () => {
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("submits login with email and password", async () => {
    mockApiFetch.mockResolvedValue({
      session: {
        access_token: "token",
        user: { id: "1", email: "u@test.com", user_metadata: {} },
      },
    });
    renderAuth();
    const loginCard = screen.getByRole("heading", { name: /welcome back/i }).closest(".flip-face")!;
    const loginForm = loginCard.querySelector("form")!;
    await userEvent.type(within(loginForm).getByLabelText(/email/i), "test@example.com");
    await userEvent.type(within(loginForm).getByPlaceholderText(/your password/i), "password123");
    await userEvent.click(within(loginForm).getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
        })
      );
    });
  });

  it("shows validation for required fields", async () => {
    renderAuth();
    const loginCard = screen.getByRole("heading", { name: /welcome back/i }).closest(".flip-face")!;
    const emailInput = within(loginCard).getByLabelText(/email/i);
    expect(emailInput).toBeRequired();
  });
});
