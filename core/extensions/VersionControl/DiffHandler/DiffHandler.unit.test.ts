import { FileStatus } from "../../Watchers/model/FileStatus";
import { getDiff, getMatchingPercent } from "./DiffHandler";
import { Change } from "./model/Change";

describe("DiffHandler", () => {
	describe("Находит изменения между двумя файлами", () => {
		test("находит диапазон текста, который был удален", () => {
			const newContent = "content";
			const oldContent = "old content";
			const output: Change[] = [
				{ type: FileStatus.delete, value: "old " },
				{ value: "content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
		test("который был добавлен", () => {
			const newContent = "new content";
			const oldContent = "content";
			const output: Change[] = [
				{ type: FileStatus.new, value: "new " },
				{ value: "content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
		test("находит диапазоны текстов, которые был добавлены и удалены", () => {
			const newContent = "n content";
			const oldContent = "old content";
			const output: Change[] = [
				{ type: FileStatus.delete, value: "old" },
				{ type: FileStatus.new, value: "n" },
				{ value: " content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
	});
	describe("Находит процент совпадения", () => {
		describe("Двух одинаковых текстов", () => {
			test("Без лишних переносов текста", () => {
				const text1 = "identical\n1\n2\n3";
				const text2 = "identical\n1\n2\n3";

				expect(getMatchingPercent(text1, text2)).toEqual(100);
			});
			test("С лишними переносами текста", () => {
				const text1 = "identical\n1\n2\n3";
				const text2 = "identical\n1\n2\n3\n";

				expect(getMatchingPercent(text1, text2)).not.toEqual(100);
			});
		});

		test("Двух совершенно разных текстов", () => {
			const text1 = "aaa\n1\n2\n3";
			const text2 = "bbb\n4\n5\n6";

			expect(getMatchingPercent(text1, text2)).toEqual(0);
		});
		test("Двух текстов, у которых совпадает ровно половина текста", () => {
			const text1 = "aaa\nbbb\n2\n3";
			const text2 = "aaa\nbbb\n5\n6";

			expect(getMatchingPercent(text1, text2)).toEqual(50);
		});
	});
});
