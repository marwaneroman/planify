/**
 * Unit tests for API service (with mocked apiFetch)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/apiClient";

const mockFetch = apiFetch as ReturnType<typeof vi.fn>;

describe("API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({});
  });

  it("createOrganization calls POST /api/organizations", async () => {
    mockFetch.mockResolvedValue({ id: "org-1" });
    const result = await api.createOrganization("Acme", "Description");
    expect(mockFetch).toHaveBeenCalledWith("/api/organizations", {
      method: "POST",
      body: JSON.stringify({ name: "Acme", description: "Description" }),
    });
    expect(result).toEqual({ id: "org-1" });
  });

  it("fetchOrganizations calls GET /api/organizations", async () => {
    const orgs = [{ id: "1", name: "Org" }];
    mockFetch.mockResolvedValue(orgs);
    const result = await api.fetchOrganizations();
    expect(mockFetch).toHaveBeenCalledWith("/api/organizations");
    expect(result).toEqual(orgs);
  });

  it("fetchProjects calls correct path with orgId", async () => {
    mockFetch.mockResolvedValue([]);
    await api.fetchProjects("org-123");
    expect(mockFetch).toHaveBeenCalledWith("/api/organizations/org-123/projects");
  });

  it("createTask sends task payload", async () => {
    mockFetch.mockResolvedValue({ id: "task-1" });
    await api.createTask("proj-1", "Task title", "Desc", "high", "todo", "user-1", "2025-12-01");
    expect(mockFetch).toHaveBeenCalledWith("/api/projects/proj-1/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Task title",
        description: "Desc",
        priority: "high",
        status: "todo",
        assigneeId: "user-1",
        dueDate: "2025-12-01",
      }),
    });
  });
});
