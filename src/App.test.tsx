import { describe, it, expect, vi, beforeEach } from "vitest";
import { connectionService } from "@/services/tauri/connections";
import { credentialService } from "@/services/tauri/credentials";
import { folderService } from "@/services/tauri/folders";
import { tagService } from "@/services/tauri/tags";
import { Connection } from "@/types/connection";

// Mock Tauri invoke function
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (cmd: string, args?: Record<string, unknown>) => {
    const payload = args?.payload as Record<string, unknown> | undefined;

    switch (cmd) {
      case "list_connections":
        return [
          {
            id: "conn-1",
            name: "Prod SSH Server",
            protocol: "SSH",
            host: "10.0.0.1",
            port: 22,
            username: "root",
            credentialId: "cred-1",
            folderId: "folder-1",
            favorite: true,
            tags: [{ id: "tag-1", name: "production", color: "#ef4444" }],
            createdAt: "2026-08-13T00:00:00Z",
            updatedAt: "2026-08-13T00:00:00Z",
          },
        ];
      case "get_connection":
        return {
          id: args?.id as string,
          name: "Prod SSH Server",
          protocol: "SSH",
          host: "10.0.0.1",
          port: 22,
          username: "root",
          favorite: true,
          tags: [],
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };
      case "create_connection":
        return {
          id: "new-conn-id",
          ...(payload || {}),
          tags: [],
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };
      case "update_connection":
        return {
          id: args?.id as string,
          name: "Updated Name",
          protocol: "SSH",
          host: "10.0.0.1",
          port: 22,
          username: "root",
          favorite: payload?.favorite ?? false,
          tags: [],
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };
      case "delete_connection":
        return undefined;
      case "duplicate_connection":
        return {
          id: "dup-conn-id",
          name: "Prod SSH Server (Copy)",
          protocol: "SSH",
          host: "10.0.0.1",
          port: 22,
          username: "root",
          favorite: true,
          tags: [],
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };

      case "list_credentials_metadata":
        return [
          {
            id: "cred-1",
            name: "Root Password",
            credentialType: "Password",
            provider: "OSKeyring",
            usernameHint: "root",
            createdAt: "2026-08-13T00:00:00Z",
            updatedAt: "2026-08-13T00:00:00Z",
          },
        ];
      case "create_credential":
        return {
          id: "new-cred-id",
          name: payload?.name as string,
          credentialType: payload?.credentialType as string,
          provider: "OSKeyring",
          usernameHint: payload?.usernameHint as string,
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };
      case "update_credential":
        return {
          id: args?.id as string,
          name: (payload?.name as string) ?? "Root Password",
          credentialType: "Password",
          provider: "OSKeyring",
          usernameHint: "root",
          createdAt: "2026-08-13T00:00:00Z",
          updatedAt: "2026-08-13T00:00:00Z",
        };
      case "delete_credential":
        return undefined;

      case "list_folders":
        return [{ id: "folder-1", name: "Production", parentId: null, createdAt: "", updatedAt: "" }];
      case "create_folder":
        return { id: "new-folder-id", name: args?.name as string, parentId: (args?.parentId as string) ?? null, createdAt: "", updatedAt: "" };
      case "delete_folder":
        return undefined;

      case "list_tags":
        return [{ id: "tag-1", name: "production", color: "#ef4444" }];
      case "create_tag":
        return { id: "new-tag-id", name: args?.name as string, color: (args?.color as string) ?? "#64748b" };
      case "delete_tag":
        return undefined;

      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  }),
}));

describe("Phase 3 - Frontend Services & Tauri IPC Wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists connections successfully", async () => {
    const list = await connectionService.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Prod SSH Server");
    expect(list[0].protocol).toBe("SSH");
  });

  it("creates a connection via IPC", async () => {
    const created = await connectionService.create({
      name: "New Server",
      protocol: "RDP",
      host: "192.168.1.50",
      port: 3389,
      username: "Administrator",
    });
    expect(created.id).toBe("new-conn-id");
    expect(created.name).toBe("New Server");
  });

  it("duplicates a connection via IPC", async () => {
    const duplicated = await connectionService.duplicate("conn-1");
    expect(duplicated.name).toContain("(Copy)");
    expect(duplicated.id).toBe("dup-conn-id");
  });

  it("deletes a connection via IPC", async () => {
    await expect(connectionService.delete("conn-1")).resolves.toBeUndefined();
  });

  it("toggles connection favorite state", async () => {
    const mockConn: Connection = {
      id: "conn-1",
      name: "Prod SSH Server",
      protocol: "SSH",
      host: "10.0.0.1",
      port: 22,
      username: "root",
      favorite: true,
      tags: [],
      createdAt: "",
      updatedAt: "",
    };
    const updated = await connectionService.toggleFavorite(mockConn);
    expect(updated.favorite).toBe(false);
  });

  it("lists credential metadata without plain secrets", async () => {
    const creds = await credentialService.listMetadata();
    expect(creds).toHaveLength(1);
    expect(creds[0].name).toBe("Root Password");
    expect(creds[0].provider).toBe("OSKeyring");
    // Verify object does not contain secret fields
    expect((creds[0] as unknown as Record<string, unknown>).secret).toBeUndefined();
  });

  it("creates credentials via IPC", async () => {
    const cred = await credentialService.create({
      name: "App Token",
      credentialType: "Password",
      secret: "super-secret-password-123",
    });
    expect(cred.id).toBe("new-cred-id");
    expect(cred.name).toBe("App Token");
  });

  it("creates and lists folders and tags", async () => {
    const folder = await folderService.create("Staging");
    expect(folder.name).toBe("Staging");

    const tag = await tagService.create("web", "#3b82f6");
    expect(tag.name).toBe("web");
  });
});
