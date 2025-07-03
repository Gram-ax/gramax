import Sheet, { SheetType, SheetRow, SheetColumn } from "./Sheet";

describe("Sheet", () => {
	describe("Constructor and static methods", () => {
		test("fromEmpty creates empty sheet with given dimensions", () => {
			const sheet = Sheet.fromEmpty<string>(3, 4);

			expect(sheet.getSheet()).toEqual([
				[null, null, null, null],
				[null, null, null, null],
				[null, null, null, null],
			]);
		});

		test("fromArray creates sheet from array", () => {
			const data: SheetType<string> = [
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
			];
			const sheet = Sheet.fromArray(data);

			expect(sheet.getSheet()).toEqual(data);
		});
	});

	describe("Basic cell operations", () => {
		let sheet: Sheet<string>;

		beforeEach(() => {
			const data: SheetType<string> = [
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
				["A3", "B3", "C3"],
			];
			sheet = Sheet.fromArray(data);
		});

		test("getCell returns cell content", () => {
			expect(sheet.getCell(0, 0)).toBe("A1");
			expect(sheet.getCell(1, 2)).toBe("C2");
			expect(sheet.getCell(2, 1)).toBe("B3");
		});

		test("getRow returns row", () => {
			expect(sheet.getRow(0)).toEqual(["A1", "B1", "C1"]);
			expect(sheet.getRow(1)).toEqual(["A2", "B2", "C2"]);
		});

		test("getColumn returns column", () => {
			expect(sheet.getColumn(0)).toEqual(["A1", "A2", "A3"]);
			expect(sheet.getColumn(2)).toEqual(["C1", "C2", "C3"]);
		});

		test("getSheet returns entire sheet", () => {
			expect(sheet.getSheet()).toEqual([
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
				["A3", "B3", "C3"],
			]);
		});
	});

	describe("Addition methods", () => {
		let sheet: Sheet<string>;

		beforeEach(() => {
			const data: SheetType<string> = [
				["A1", "B1"],
				["A2", "B2"],
			];
			sheet = Sheet.fromArray(data);
		});

		test("appendRow adds row", () => {
			const newRow: SheetRow<string> = ["A3", "B3"];
			sheet.appendRow(newRow);

			expect(sheet.getSheet()).toEqual([
				["A1", "B1"],
				["A2", "B2"],
				["A3", "B3"],
			]);
		});

		test("appendColumn adds column", () => {
			const newColumn: SheetColumn<string> = ["C1", "C2"];
			sheet.appendColumn(newColumn);

			expect(sheet.getSheet()).toEqual([
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
			]);
		});
	});

	describe("Removal methods", () => {
		let sheet: Sheet<string>;

		beforeEach(() => {
			const data: SheetType<string> = [
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
				["A3", "B3", "C3"],
			];
			sheet = Sheet.fromArray(data);
		});

		test("removeCell removes cell", () => {
			sheet.removeCell(1, 1);

			expect(sheet.getRow(0)).toEqual(["A1", "B1", "C1"]);
			expect(sheet.getRow(1)).toEqual(["A2", "C2"]);
			expect(sheet.getRow(2)).toEqual(["A3", "B3", "C3"]);
		});

		test("removeRow removes row", () => {
			sheet.removeRow(1);

			expect(sheet.getSheet()).toEqual([
				["A1", "B1", "C1"],
				["A3", "B3", "C3"],
			]);
		});

		test("removeColumn removes column", () => {
			sheet.removeColumn(1);

			expect(sheet.getSheet()).toEqual([
				["A1", "C1"],
				["A2", "C2"],
				["A3", "C3"],
			]);
		});
	});

	describe("Slicing methods", () => {
		let sheet: Sheet<string>;

		beforeEach(() => {
			const data: SheetType<string> = [
				["A1", "B1", "C1", "D1"],
				["A2", "B2", "C2", "D2"],
				["A3", "B3", "C3", "D3"],
				["A4", "B4", "C4", "D4"],
			];
			sheet = Sheet.fromArray(data);
		});

		test("sliceRow slices rows", () => {
			expect(sheet.sliceRow(1, 3)).toEqual([
				["A2", "B2", "C2", "D2"],
				["A3", "B3", "C3", "D3"],
			]);
		});

		test("sliceColumn slices columns", () => {
			expect(sheet.sliceColumn(1, 3)).toEqual([
				["B1", "C1"],
				["B2", "C2"],
				["B3", "C3"],
				["B4", "C4"],
			]);
		});
	});

	describe("Map method", () => {
		test("map applies function to each cell", () => {
			const data: SheetType<number> = [
				[1, 2, 3],
				[4, 5, 6],
			];
			const sheet = Sheet.fromArray(data);

			const result = sheet.map((cell) => cell * 2);

			expect(result).toEqual([
				[2, 4, 6],
				[8, 10, 12],
			]);
		});

		test("map handles null values", () => {
			const data: SheetType<number> = [
				[1, null, 3],
				[null, 5, null],
			];
			const sheet = Sheet.fromArray(data);

			const result = sheet.map((cell) => (cell === null ? 0 : cell * 2));

			expect(result).toEqual([
				[2, 0, 6],
				[0, 10, 0],
			]);
		});
	});

	describe("Cell merging", () => {
		let sheet: Sheet<string>;

		beforeEach(() => {
			const data: SheetType<string> = [
				["A1", "B1", "C1", "D1"],
				["A2", "B2", "C2", "D2"],
				["A3", "B3", "C3", "D3"],
				["A4", "B4", "C4", "D4"],
			];
			sheet = Sheet.fromArray(data);
		});

		test("mergeCells merges cells", () => {
			sheet.mergeCells(0, 0, 1, 1);

			expect(sheet.isCellMerged(0, 0)).toBe(true);
			expect(sheet.isCellMerged(0, 1)).toBe(true);
			expect(sheet.isCellMerged(1, 0)).toBe(true);
			expect(sheet.isCellMerged(1, 1)).toBe(true);
			expect(sheet.isCellMerged(0, 2)).toBe(false);
		});

		test("getCell returns master cell content for merged cells", () => {
			sheet.mergeCells(0, 0, 1, 1);

			expect(sheet.getCell(0, 0)).toBe("A1");
			expect(sheet.getCell(0, 1)).toBe("A1");
			expect(sheet.getCell(1, 0)).toBe("A1");
			expect(sheet.getCell(1, 1)).toBe("A1");
		});

		test("getMasterCell returns master cell coordinates", () => {
			sheet.mergeCells(0, 0, 1, 1);

			const masterCell = sheet.getMasterCell(1, 1);
			expect(masterCell).toEqual({
				row: 0,
				column: 0,
				content: "A1",
			});
		});

		test("getMasterCell returns null for non-merged cell", () => {
			const masterCell = sheet.getMasterCell(0, 2);
			expect(masterCell).toBeNull();
		});

		test("unmergeCells unmerges cells", () => {
			sheet.mergeCells(0, 0, 1, 1);
			sheet.unmergeCells(0, 0);

			expect(sheet.isCellMerged(0, 0)).toBe(false);
			expect(sheet.isCellMerged(0, 1)).toBe(false);
			expect(sheet.isCellMerged(1, 0)).toBe(false);
			expect(sheet.isCellMerged(1, 1)).toBe(false);

			expect(sheet.getCell(0, 0)).toBe("A1");
			expect(sheet.getCell(0, 1)).toBe(null);
			expect(sheet.getCell(1, 0)).toBe(null);
			expect(sheet.getCell(1, 1)).toBe(null);
		});

		test("unmergeCells can be called for any cell in merged area", () => {
			sheet.mergeCells(0, 0, 1, 1);
			sheet.unmergeCells(1, 1);

			expect(sheet.isCellMerged(0, 0)).toBe(false);
			expect(sheet.isCellMerged(1, 1)).toBe(false);
		});

		test("mergeCells throws error for invalid range", () => {
			expect(() => sheet.mergeCells(-1, 0, 1, 1)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(0, -1, 1, 1)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(0, 0, -1, 1)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(0, 0, 1, -1)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(1, 1, 0, 0)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(0, 1, 0, 0)).toThrow("Invalid range for merging cells");
		});

		test("mergeCells throws error for out of bounds", () => {
			expect(() => sheet.mergeCells(0, 0, 10, 10)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(10, 0, 10, 1)).toThrow("Invalid range for merging cells");
			expect(() => sheet.mergeCells(0, 10, 1, 10)).toThrow("Invalid range for merging cells");
		});

		test("removeCell unmerges cells before removal", () => {
			sheet.mergeCells(0, 0, 1, 1);
			sheet.removeCell(0, 0);

			expect(sheet.getRow(0)).toEqual([null, "C1", "D1"]);
		});

		test("removeRow unmerges cells in row before removal", () => {
			sheet.mergeCells(0, 0, 1, 1);
			sheet.removeRow(0);

			expect(sheet.getSheet().length).toBe(3);
			expect(sheet.getRow(0)).toEqual([null, null, "C2", "D2"]);
		});

		test("removeColumn unmerges cells in column before removal", () => {
			sheet.mergeCells(0, 0, 1, 1);
			sheet.removeColumn(0);

			expect(sheet.getColumn(0)).toEqual([null, null, "B3", "B4"]);
		});
	});

	describe("Merging empty cells", () => {
		test("mergeCells with empty cells uses first non-empty value", () => {
			const data: SheetType<string> = [
				[null, "B1"],
				["A2", null],
			];
			const sheet = Sheet.fromArray(data);

			sheet.mergeCells(0, 0, 1, 1);

			expect(sheet.getCell(0, 0)).toBe("B1");
			expect(sheet.getCell(0, 1)).toBe("B1");
			expect(sheet.getCell(1, 0)).toBe("B1");
			expect(sheet.getCell(1, 1)).toBe("B1");
		});

		test("mergeCells with completely empty cells preserves null", () => {
			const data: SheetType<string> = [
				[null, null],
				[null, null],
			];
			const sheet = Sheet.fromArray(data);

			sheet.mergeCells(0, 0, 1, 1);

			expect(sheet.getCell(0, 0)).toBe(null);
			expect(sheet.getCell(1, 1)).toBe(null);
		});
	});

	describe("Complex scenarios", () => {
		test("map works correctly with merged cells", () => {
			const data: SheetType<number> = [
				[1, 2, 3],
				[4, 5, 6],
				[7, 8, 9],
			];
			const sheet = Sheet.fromArray(data);

			sheet.mergeCells(0, 0, 1, 1);

			const result = sheet.map((cell) => cell * 10);

			expect(result).toEqual([
				[10, 10, 30],
				[10, 10, 60],
				[70, 80, 90],
			]);
		});

		test("getRow and getColumn work correctly with merged cells", () => {
			const data: SheetType<string> = [
				["A1", "B1", "C1"],
				["A2", "B2", "C2"],
				["A3", "B3", "C3"],
			];
			const sheet = Sheet.fromArray(data);

			sheet.mergeCells(0, 0, 1, 1);

			expect(sheet.getRow(0)).toEqual(["A1", "C1", "C2"]);
			expect(sheet.getRow(1)).toEqual(["A1", "C1", "C2"]);
			expect(sheet.getColumn(0)).toEqual(["A1", "A3", "B3"]);
			expect(sheet.getColumn(1)).toEqual(["A1", "A3", "B3"]);
		});
	});
});
