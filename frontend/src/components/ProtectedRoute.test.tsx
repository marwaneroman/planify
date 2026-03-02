/**
 * Integration tests for ProtectedRoute (auth + routing)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const ProtectedContent = () => <div>Protected content</div>;

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div>Auth page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRouter();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to /auth when not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    expect(screen.getByText("Auth page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", email: "u@test.com" },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
