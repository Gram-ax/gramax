import { NodeModel } from "@minoru/react-dnd-treeview";
import getMovements, { Movement } from "./getMovements";

const parseMovements = (movements: Movement[]) =>
	movements.map(
		({ moveItem, oldList, newList }) =>
			`Элемент ${moveItem.text} переместить с ${oldList.map((i) => i.text).join("/")} на ${newList
				.map((i) => i.text)
				.join("/")}`,
	);

const getTestMovements = (oldNav: NodeModel[], newNav: NodeModel[]) => parseMovements(getMovements(oldNav, newNav));

describe("getMovements распознает перемещение", () => {
	describe("файла", () => {
		test("c корня в папку", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "File1" },
				{ id: 2, parent: 0, text: "Folder1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 2, text: "File1" },
				{ id: 2, parent: 0, text: "Folder1" },
			];

			const expectedMovements = ["Элемент File1 переместить с Root/File1 на Root/Folder1/File1"];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("с корня в подпапку", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 0, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 2, text: "File1" },
			];

			const expectedMovements = ["Элемент File1 переместить с Root/File1 на Root/Folder1/Folder2/File1"];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("c папки в корень", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "File1" },
			];

			const expectedMovements = ["Элемент File1 переместить с Root/Folder1/File1 на Root/File1"];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("c падпапки в корень", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 2, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 0, text: "File1" },
			];

			const expectedMovements = ["Элемент File1 переместить с Root/Folder1/Folder2/File1 на Root/File1"];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("с одной папки в другую", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "Folder2" },
				{ id: 3, parent: 2, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "Folder2" },
				{ id: 3, parent: 1, text: "File1" },
			];

			const expectedMovements = ["Элемент File1 переместить с Root/Folder2/File1 на Root/Folder1/File1"];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});
	});

	describe("папки с файлами", () => {
		test("с корня в папку", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "File1" },
				{ id: 3, parent: 0, text: "Folder2" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 3, text: "Folder1" },
				{ id: 2, parent: 1, text: "File1" },
				{ id: 3, parent: 0, text: "Folder2" },
			];

			const expectedMovements = [
				"Элемент Folder1 переместить с Root/Folder1 на Root/Folder2/Folder1",
				"Элемент File1 переместить с Root/Folder1/File1 на Root/Folder2/Folder1/File1",
			];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("с корня в подпапку", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "File1" },
				{ id: 3, parent: 0, text: "Folder2" },
				{ id: 4, parent: 3, text: "Folder3" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 4, text: "Folder1" },
				{ id: 2, parent: 1, text: "File1" },
				{ id: 3, parent: 0, text: "Folder2" },
				{ id: 4, parent: 3, text: "Folder3" },
			];

			const expectedMovements = [
				"Элемент Folder1 переместить с Root/Folder1 на Root/Folder2/Folder3/Folder1",
				"Элемент File1 переместить с Root/Folder1/File1 на Root/Folder2/Folder3/Folder1/File1",
			];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});

		test("c папки в корень", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 2, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "Folder2" },
				{ id: 3, parent: 2, text: "File1" },
			];

			const expectedMovements = [
				"Элемент Folder2 переместить с Root/Folder1/Folder2 на Root/Folder2",
				"Элемент File1 переместить с Root/Folder1/Folder2/File1 на Root/Folder2/File1",
			];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});
		test("c падпапки в корень", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 2, text: "Folder3" },
				{ id: 4, parent: 3, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 1, text: "Folder2" },
				{ id: 3, parent: 0, text: "Folder3" },
				{ id: 4, parent: 3, text: "File1" },
			];

			const expectedMovements = [
				"Элемент Folder3 переместить с Root/Folder1/Folder2/Folder3 на Root/Folder3",
				"Элемент File1 переместить с Root/Folder1/Folder2/Folder3/File1 на Root/Folder3/File1",
			];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});
		test("с одной папки в другую", () => {
			const oldNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "Folder2" },
				{ id: 3, parent: 2, text: "Folder3" },
				{ id: 4, parent: 3, text: "File1" },
			];

			const newNav: NodeModel[] = [
				{ id: 0, parent: null, text: "Root" },
				{ id: 1, parent: 0, text: "Folder1" },
				{ id: 2, parent: 0, text: "Folder2" },
				{ id: 3, parent: 1, text: "Folder3" },
				{ id: 4, parent: 3, text: "File1" },
			];

			const expectedMovements = [
				"Элемент Folder3 переместить с Root/Folder2/Folder3 на Root/Folder1/Folder3",
				"Элемент File1 переместить с Root/Folder2/Folder3/File1 на Root/Folder1/Folder3/File1",
			];

			const result = getTestMovements(oldNav, newNav);

			expect(result).toEqual(expectedMovements);
		});
	});
});
