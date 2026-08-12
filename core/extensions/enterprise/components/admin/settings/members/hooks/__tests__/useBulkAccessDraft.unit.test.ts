import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import {
	getBulkRepoUserRules,
	MIXED_ROLE,
	type RoleValue,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import t from "@ext/localization/locale/translate";
import { act, renderHook } from "@testing-library/react";
import { type AccessRow, type BulkAccessRow, useBulkAccessDraft } from "../useBulkAccessDraft";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

interface Ent {
	id: string;
}

interface Cont {
	id: string;
}

type Row = BulkAccessRow<Ent, Cont>;

const getEntId = (x: Ent) => x.id;
const getContId = (x: Cont) => x.id;

const repos: Cont[] = [{ id: "repo-1" }, { id: "repo-2" }];

const branchesRequired = () => t("enterprise.admin.resources.branches.required");

const cont = (id: string, role: RoleId, branches?: string[]): [string, AccessRow<Cont>] => [
	id,
	{ cont: { id }, role, branches },
];

const row = (id: string, role: RoleValue, containers: [string, AccessRow<Cont>][], branches?: string[]): Row => ({
	ent: { id },
	role,
	branches,
	containers: new Map(containers),
});

const render = (rows: Row[], allContainers: Cont[] = repos) =>
	renderHook(() =>
		useBulkAccessDraft<Ent, Cont>({
			initial: new Map(rows.map((x) => [x.ent.id, x])),
			allContainers,
			roleRules: getBulkRepoUserRules(),
			getEntId,
			getContId,
		}),
	);

describe("useBulkAccessDraft", () => {
	it("exposes the initial rows", () => {
		const { result } = render([row("u1", "reader", [cont("repo-1", "reader")])]);

		expect(result.current.rows).toEqual([row("u1", "reader", [cont("repo-1", "reader")])]);
		expect(result.current.rowVersions).toEqual(new Map());
	});

	describe("setRole", () => {
		it("applies the role to the row and all its containers", () => {
			const { result } = render([row("u1", "reader", [cont("repo-1", "reader"), cont("repo-2", "reader")])]);

			act(() => result.current.setRole("u1", "editor"));

			expect(result.current.rows).toEqual([
				row("u1", "editor", [cont("repo-1", "editor"), cont("repo-2", "editor")]),
			]);
			expect(result.current.rowVersions).toEqual(new Map([["u1", 1]]));
		});

		it("resolves a mixed role into one role everywhere", () => {
			const { result } = render([row("u1", MIXED_ROLE, [cont("repo-1", "reader"), cont("repo-2", "editor")])]);

			act(() => result.current.setRole("u1", "editor"));

			expect(result.current.rows).toEqual([
				row("u1", "editor", [cont("repo-1", "editor"), cont("repo-2", "editor")]),
			]);
		});

		it("keeps container branches untouched", () => {
			const { result } = render([row("u1", "reviewer", [cont("repo-1", "reviewer", ["main"])], ["main"])]);

			act(() => result.current.setRole("u1", "editor"));

			expect(result.current.rows).toEqual([row("u1", "editor", [cont("repo-1", "editor", ["main"])], ["main"])]);
		});

		it("leaves the rows alone for an unknown row or an unchanged role", () => {
			const initial = row("u1", "reader", [cont("repo-1", "reader")]);
			const { result } = render([initial]);

			act(() => result.current.setRole("u1", "reader"));
			act(() => result.current.setRole("missing", "editor"));

			expect(result.current.rows).toEqual([initial]);
			expect(result.current.rowVersions).toEqual(
				new Map([
					["u1", 1],
					["missing", 1],
				]),
			);
		});
	});

	describe("setBranches", () => {
		it("applies the branches to the row and all its containers", () => {
			const { result } = render([
				row("u1", "reviewer", [cont("repo-1", "reviewer"), cont("repo-2", "reviewer")]),
			]);

			act(() => result.current.setBranches("u1", ["main", "dev"], "reviewer"));

			expect(result.current.rows).toEqual([
				row(
					"u1",
					"reviewer",
					[cont("repo-1", "reviewer", ["main", "dev"]), cont("repo-2", "reviewer", ["main", "dev"])],
					["main", "dev"],
				),
			]);
			expect(result.current.rowVersions).toEqual(new Map([["u1", 1]]));
		});

		it("makes a reviewer valid once branches are picked", () => {
			const { result } = render([row("u1", "reviewer", [cont("repo-1", "reviewer")])]);

			act(() => result.current.setBranches("u1", ["main"], "reviewer"));

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(true);
			expect(result.current.branchErrors).toEqual(new Map());
		});

		it("keeps a reviewer invalid when the branches are cleared", () => {
			const { result } = render([row("u1", "reviewer", [cont("repo-1", "reviewer", ["main"])], ["main"])]);

			act(() => result.current.setBranches("u1", [], "reviewer"));

			expect(result.current.branchErrors).toEqual(new Map([["u1", branchesRequired()]]));

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(false);
			expect(result.current.rows).toEqual([row("u1", "reviewer", [cont("repo-1", "reviewer", [])], [])]);
		});

		it("clears the error for a non-reviewer without branches", () => {
			const { result } = render([row("u1", "editor", [cont("repo-1", "editor")])]);

			act(() => result.current.setBranches("u1", [], "editor"));

			expect(result.current.branchErrors).toEqual(new Map([["u1", null]]));
		});

		it("ignores an unknown row", () => {
			const initial = row("u1", "reader", [cont("repo-1", "reader")]);
			const { result } = render([initial]);

			act(() => result.current.setBranches("missing", ["main"], "reader"));

			expect(result.current.rows).toEqual([initial]);
		});
	});

	describe("add", () => {
		it("grants the role on every container", () => {
			const { result } = render([]);

			act(() => result.current.add([{ ent: { id: "u1" }, role: "editor" }]));

			expect(result.current.rows).toEqual([
				row("u1", "editor", [cont("repo-1", "editor"), cont("repo-2", "editor")]),
			]);
		});

		it("spreads reviewer branches to every container", () => {
			const { result } = render([]);

			act(() => result.current.add([{ ent: { id: "u1" }, role: "reviewer", branches: ["main"] }]));

			expect(result.current.rows).toEqual([
				row(
					"u1",
					"reviewer",
					[cont("repo-1", "reviewer", ["main"]), cont("repo-2", "reviewer", ["main"])],
					["main"],
				),
			]);
		});

		it("replaces an existing row instead of merging into it", () => {
			const { result } = render([row("u1", "reader", [cont("repo-1", "reader")])]);

			act(() => result.current.add([{ ent: { id: "u1" }, role: "editor" }]));

			expect(result.current.rows).toEqual([
				row("u1", "editor", [cont("repo-1", "editor"), cont("repo-2", "editor")]),
			]);
		});
	});

	describe("remove", () => {
		it("drops only the listed rows", () => {
			const { result } = render([
				row("u1", "reader", [cont("repo-1", "reader")]),
				row("u2", "editor", [cont("repo-2", "editor")]),
			]);

			act(() => result.current.remove(["u1"]));

			expect(result.current.rows).toEqual([row("u2", "editor", [cont("repo-2", "editor")])]);
		});
	});

	describe("applyToAll", () => {
		it("adds the missing containers and keeps the existing ones untouched", () => {
			const initial = row("u1", "editor", [cont("repo-1", "reader")]);
			const { result } = render([initial]);

			act(() => result.current.applyToAll([initial]));

			expect(result.current.rows).toEqual([
				row("u1", "editor", [cont("repo-1", "reader"), cont("repo-2", "editor")]),
			]);
		});

		it("falls back to reader for a mixed role", () => {
			const initial = row("u1", MIXED_ROLE, [cont("repo-1", "editor")]);
			const { result } = render([initial]);

			act(() => result.current.applyToAll([initial]));

			expect(result.current.rows).toEqual([
				row("u1", MIXED_ROLE, [cont("repo-1", "editor"), cont("repo-2", "reader")]),
			]);
		});

		it("carries branches only for a reviewer", () => {
			const reviewer = row("u1", "reviewer", [], ["main"]);
			const editor = row("u2", "editor", [], ["main"]);
			const { result } = render([reviewer, editor]);

			act(() => result.current.applyToAll([reviewer, editor]));

			expect(result.current.rows).toEqual([
				row(
					"u1",
					"reviewer",
					[cont("repo-1", "reviewer", ["main"]), cont("repo-2", "reviewer", ["main"])],
					["main"],
				),
				row("u2", "editor", [cont("repo-1", "editor"), cont("repo-2", "editor")], ["main"]),
			]);
		});
	});

	describe("validate", () => {
		it("fails and bumps the version of every reviewer without branches", () => {
			const { result } = render([
				row("u1", "reviewer", []),
				row("u2", "reviewer", [], ["main"]),
				row("u3", "editor", []),
			]);

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(false);
			expect(result.current.branchErrors).toEqual(new Map([["u1", branchesRequired()]]));
			expect(result.current.rowVersions).toEqual(new Map([["u1", 1]]));
		});

		it("passes and clears earlier errors once the reviewer has branches", () => {
			const { result } = render([row("u1", "reviewer", [])]);

			act(() => {
				result.current.validate();
			});
			act(() => result.current.add([{ ent: { id: "u1" }, role: "reviewer", branches: ["main"] }]));

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(true);
			expect(result.current.branchErrors).toEqual(new Map());
		});
	});

	it("exposes the role, branches and coverage columns", () => {
		const { result } = render([]);

		expect(result.current.columns.map((x) => x.id)).toEqual(["role", "branches", "coverage"]);
	});
});
