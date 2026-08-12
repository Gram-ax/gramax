import { getUserRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import t from "@ext/localization/locale/translate";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { type RoleAccessRow, useAccessDraft } from "../useAccessDraft";

jest.mock("@ext/enterprise/components/admin/contexts/SettingsContext", () => ({
	useSettings: () => ({ searchBranches: async () => [] }),
}));

interface Row extends RoleAccessRow {
	id: string;
}

const getId = (row: Row) => row.id;
const branchesRequired = () => t("enterprise.admin.resources.branches.required");

const render = (rows: Row[]) =>
	renderHook(() => {
		const [rowsMap, setRowsMap] = useState(() => new Map(rows.map((x) => [x.id, x])));
		const draft = useAccessDraft<Row>({ rowsMap, setRowsMap, roleRules: getUserRules(), getId });
		return { rowsMap, ...draft };
	});

describe("useAccessDraft", () => {
	describe("setRole", () => {
		it("updates every listed row and bumps their versions", () => {
			const { result } = render([
				{ id: "a", role: "reader" },
				{ id: "b", role: "reader" },
				{ id: "c", role: "reader" },
			]);

			act(() => result.current.setRole(["a", "b"], "editor"));

			expect(result.current.rowsMap).toEqual(
				new Map([
					["a", { id: "a", role: "editor" }],
					["b", { id: "b", role: "editor" }],
					["c", { id: "c", role: "reader" }],
				]),
			);
			expect(result.current.rowVersions).toEqual(
				new Map([
					["a", 1],
					["b", 1],
				]),
			);
		});

		it("keeps branches when only the role changes", () => {
			const { result } = render([{ id: "a", role: "reviewer", branches: ["main"] }]);

			act(() => result.current.setRole(["a"], "editor"));

			expect(result.current.rowsMap).toEqual(new Map([["a", { id: "a", role: "editor", branches: ["main"] }]]));
		});

		it("keeps the same map instance when no row changes", () => {
			const { result } = render([{ id: "a", role: "reader" }]);
			const before = result.current.rowsMap;

			act(() => result.current.setRole(["a", "missing"], "reader"));

			expect(result.current.rowsMap).toBe(before);
			expect(result.current.rowVersions).toEqual(
				new Map([
					["a", 1],
					["missing", 1],
				]),
			);
		});
	});

	describe("setBranches", () => {
		it("stores branches and clears the error for a reviewer", () => {
			const { result } = render([{ id: "a", role: "reviewer" }]);

			act(() => result.current.setBranches("a", ["main", "dev"], "reviewer"));

			expect(result.current.rowsMap).toEqual(
				new Map([["a", { id: "a", role: "reviewer", branches: ["main", "dev"] }]]),
			);
			expect(result.current.branchErrors).toEqual(new Map([["a", null]]));
			expect(result.current.rowVersions).toEqual(new Map([["a", 1]]));
		});

		it("sets the required error when a reviewer is left without branches", () => {
			const { result } = render([{ id: "a", role: "reviewer", branches: ["main"] }]);

			act(() => result.current.setBranches("a", [], "reviewer"));

			expect(result.current.rowsMap).toEqual(new Map([["a", { id: "a", role: "reviewer", branches: [] }]]));
			expect(result.current.branchErrors).toEqual(new Map([["a", branchesRequired()]]));
		});

		it("does not require branches for a non-reviewer", () => {
			const { result } = render([{ id: "a", role: "editor" }]);

			act(() => result.current.setBranches("a", [], "editor"));

			expect(result.current.branchErrors).toEqual(new Map([["a", null]]));
		});

		it("ignores an unknown row", () => {
			const { result } = render([{ id: "a", role: "reader" }]);

			act(() => result.current.setBranches("missing", ["main"], "reviewer"));

			expect(result.current.rowsMap).toEqual(new Map([["a", { id: "a", role: "reader" }]]));
		});
	});

	describe("add", () => {
		it("inserts new rows and replaces existing ones", () => {
			const { result } = render([{ id: "a", role: "reader" }]);

			act(() =>
				result.current.add([
					{ id: "a", role: "editor" },
					{ id: "b", role: "reader" },
				]),
			);

			expect(result.current.rowsMap).toEqual(
				new Map([
					["a", { id: "a", role: "editor" }],
					["b", { id: "b", role: "reader" }],
				]),
			);
		});

		it("keeps previously picked branches for a reviewer added without them", () => {
			const { result } = render([{ id: "a", role: "reviewer", branches: ["main"] }]);

			act(() => result.current.add([{ id: "a", role: "reviewer" }]));

			expect(result.current.rowsMap).toEqual(new Map([["a", { id: "a", role: "reviewer", branches: ["main"] }]]));
		});
	});

	describe("remove", () => {
		it("drops the rows and their branch errors", () => {
			const { result } = render([
				{ id: "a", role: "reviewer" },
				{ id: "b", role: "reader" },
			]);

			act(() => result.current.setBranches("a", [], "reviewer"));
			act(() => result.current.remove([{ id: "a", role: "reviewer" }]));

			expect(result.current.rowsMap).toEqual(new Map([["b", { id: "b", role: "reader" }]]));
			expect(result.current.branchErrors).toEqual(new Map());
		});
	});

	describe("validate", () => {
		it("fails and marks every reviewer without branches", () => {
			const { result } = render([
				{ id: "a", role: "reviewer" },
				{ id: "b", role: "reviewer", branches: [] },
				{ id: "c", role: "reviewer", branches: ["main"] },
				{ id: "d", role: "editor" },
			]);

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(false);
			expect(result.current.branchErrors).toEqual(
				new Map([
					["a", branchesRequired()],
					["b", branchesRequired()],
				]),
			);
			expect(result.current.rowVersions).toEqual(
				new Map([
					["a", 1],
					["b", 1],
				]),
			);
		});

		it("passes and clears earlier errors", () => {
			const { result } = render([{ id: "a", role: "reviewer" }]);

			act(() => {
				result.current.validate();
			});
			act(() => result.current.setBranches("a", ["main"], "reviewer"));

			let valid: boolean;
			act(() => {
				valid = result.current.validate();
			});

			expect(valid).toBe(true);
			expect(result.current.branchErrors).toEqual(new Map());
		});
	});

	it("exposes the role and branches columns", () => {
		const { result } = render([]);

		expect(result.current.columns.map((x) => x.id)).toEqual(["role", "branches"]);
	});
});
