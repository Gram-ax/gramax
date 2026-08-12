import type { AccessEntry } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import {
	applyGroupWorkspaceOwner,
	applyUserWorkspaceOwner,
	isGroupWorkspaceOwner,
	isUserWorkspaceOwner,
} from "../workspaceOwnerOps";

const makeWorkspace = (workspaceOwner?: AccessEntry): WorkspaceSettings => ({
	name: "ws",
	sections: {},
	wordTemplates: [],
	pdfTemplates: [],
	git: { source: { url: "https://example.com", type: "GitLab", repos: ["repo-1"] } },
	access: workspaceOwner ? { workspaceOwner } : undefined,
});

const owner = (overrides?: Partial<AccessEntry>): AccessEntry => ({
	gxGroups: [],
	users: [],
	...overrides,
});

describe("isGroupWorkspaceOwner", () => {
	it("finds a gx group among owners", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev"] }));

		expect(isGroupWorkspaceOwner(workspace, "dev")).toBe(true);
		expect(isGroupWorkspaceOwner(workspace, "qa")).toBe(false);
	});

	it("looks an sso group up in ssoGroups only", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev"], ssoGroups: ["sso-dev"] }));

		expect(isGroupWorkspaceOwner(workspace, "sso-dev", GroupSource.SSO_GROUPS)).toBe(true);
		expect(isGroupWorkspaceOwner(workspace, "dev", GroupSource.SSO_GROUPS)).toBe(false);
	});

	it("returns false without a workspaceOwner entry", () => {
		expect(isGroupWorkspaceOwner(makeWorkspace(), "dev")).toBe(false);
		expect(isGroupWorkspaceOwner(undefined, "dev")).toBe(false);
	});

	it("returns false when ssoGroups is absent", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev"] }));

		expect(isGroupWorkspaceOwner(workspace, "dev", GroupSource.SSO_GROUPS)).toBe(false);
	});
});

describe("isUserWorkspaceOwner", () => {
	it("matches the email case-insensitively", () => {
		const workspace = makeWorkspace(owner({ users: [{ value: "Ivan@test.com" }] }));

		expect(isUserWorkspaceOwner(workspace, "ivan@test.com")).toBe(true);
		expect(isUserWorkspaceOwner(workspace, "other@test.com")).toBe(false);
	});

	it("returns false without a workspaceOwner entry", () => {
		expect(isUserWorkspaceOwner(makeWorkspace(), "ivan@test.com")).toBe(false);
		expect(isUserWorkspaceOwner(undefined, "ivan@test.com")).toBe(false);
	});
});

describe("applyGroupWorkspaceOwner", () => {
	it("creates the workspaceOwner entry for the first gx group", () => {
		const workspace = makeWorkspace();

		applyGroupWorkspaceOwner(workspace, "dev", GroupSource.GX_GROUPS, true);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: ["dev"], users: [] } });
	});

	it("does not duplicate an already granted group", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev"] }));

		applyGroupWorkspaceOwner(workspace, "dev", GroupSource.GX_GROUPS, true);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: ["dev"], users: [] } });
	});

	it("revokes a gx group and keeps the others", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev", "qa"] }));

		applyGroupWorkspaceOwner(workspace, "dev", GroupSource.GX_GROUPS, false);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: ["qa"], users: [] } });
	});

	it("grants an sso group into ssoGroups without touching gxGroups", () => {
		const workspace = makeWorkspace(owner({ gxGroups: ["dev"] }));

		applyGroupWorkspaceOwner(workspace, "sso-dev", GroupSource.SSO_GROUPS, true);

		expect(workspace.access).toEqual({
			workspaceOwner: { gxGroups: ["dev"], ssoGroups: ["sso-dev"], users: [] },
		});
	});

	it("revokes an sso group", () => {
		const workspace = makeWorkspace(owner({ ssoGroups: ["sso-dev", "sso-qa"] }));

		applyGroupWorkspaceOwner(workspace, "sso-dev", GroupSource.SSO_GROUPS, false);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: [], ssoGroups: ["sso-qa"], users: [] } });
	});

	it("treats a group without source as a gx group", () => {
		const workspace = makeWorkspace();

		applyGroupWorkspaceOwner(workspace, "dev", undefined, true);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: ["dev"], users: [] } });
	});
});

describe("applyUserWorkspaceOwner", () => {
	it("creates the workspaceOwner entry for the first user", () => {
		const workspace = makeWorkspace();

		applyUserWorkspaceOwner(workspace, "ivan@test.com", true);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: [], users: [{ value: "ivan@test.com" }] } });
	});

	it("keeps the stored casing when the same user is granted again", () => {
		const workspace = makeWorkspace(owner({ users: [{ value: "Ivan@test.com" }] }));

		applyUserWorkspaceOwner(workspace, "ivan@test.com", true);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: [], users: [{ value: "Ivan@test.com" }] } });
	});

	it("revokes by email regardless of casing", () => {
		const workspace = makeWorkspace(owner({ users: [{ value: "Ivan@test.com" }, { value: "qa@test.com" }] }));

		applyUserWorkspaceOwner(workspace, "ivan@test.com", false);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: [], users: [{ value: "qa@test.com" }] } });
	});

	it("leaves the entry empty when revoking an unknown user", () => {
		const workspace = makeWorkspace();

		applyUserWorkspaceOwner(workspace, "ivan@test.com", false);

		expect(workspace.access).toEqual({ workspaceOwner: { gxGroups: [], users: [] } });
	});
});
