import StringsDiff from "@ext/markdown/elements/diff/logic/stringsDiff/StringsDiff";

const getDiff = (
	oldStrings: string[],
	newStrings: string[],
	canStringsBeCompared: (oldString: string, newString: string) => boolean = () => true,
) => {
	return new StringsDiff(oldStrings, newStrings, { canStringsBeCompared }).getDiff();
};

describe("StringsDiff should handle", () => {
	describe("simple 2 words strings", () => {
		test("correct order", () => {
			const diff = getDiff(["apple", "banana"], ["apple2", "orange"]);

			expect(diff.deletedIdxes).toEqual([1]);
			expect(diff.addedIdxes).toEqual([1]);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 0, newIdx: 0 },
			]);
		});

		test("incorrect order", () => {
			const diff = getDiff(["apple", "banana"], ["orange", "apple2"]);

			expect(diff.deletedIdxes).toEqual([1]);
			expect(diff.addedIdxes).toEqual([0]);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 0, newIdx: 1 },
			]);
		});
	});

	it("only deleted words", () => {
		const diff = getDiff(["apple", "banana"], []);

		expect(diff.deletedIdxes).toEqual([0, 1]);
		expect(diff.addedIdxes).toEqual([]);
		expect(diff.modified).toEqual([]);
	});

	it("only added words", () => {
		const diff = getDiff([], ["apple", "banana"]);

		expect(diff.deletedIdxes).toEqual([]);
		expect(diff.addedIdxes).toEqual([0, 1]);
		expect(diff.modified).toEqual([]);
	});

	it("only deleted and added words", () => {
		const diff = getDiff(["apple", "banana"], ["orange", "cherry"]);

		expect(diff.deletedIdxes).toEqual([0, 1]);
		expect(diff.addedIdxes).toEqual([0, 1]);
		expect(diff.modified).toEqual([]);
	});

	describe("only modified words", () => {
		test("correct order", () => {
			const diff = getDiff(["apple", "banana"], ["apple2", "banana2"]);

			expect(diff.deletedIdxes).toEqual([]);
			expect(diff.addedIdxes).toEqual([]);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 1, newIdx: 1 },
				{ oldIdx: 0, newIdx: 0 },
			]);
		});

		test("incorrect order", () => {
			const diff = getDiff(["apple", "banana"], ["banana2", "apple2"]);

			expect(diff.deletedIdxes).toEqual([]);
			expect(diff.addedIdxes).toEqual([]);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 1, newIdx: 0 },
				{ oldIdx: 0, newIdx: 1 },
			]);
		});
	});

	it("diff when word simillar to multiple words", () => {
		const diff = getDiff(["apple", "banana"], ["apple222", "orange", "apple2"]);

		expect(diff.deletedIdxes).toEqual([1]);
		expect(diff.addedIdxes).toEqual([0, 1]);
		expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([{ oldIdx: 0, newIdx: 2 }]);
	});

	it("diff with canStringsBeCompared provided", () => {
		const canStringsBeCompared = (oldString: string, newString: string) => {
			return oldString.length > 20 && newString.length > 20;
		};

		const diff = getDiff(["apple", "banana"], ["apple2", "banana2"], canStringsBeCompared);

		expect(diff.deletedIdxes).toEqual([0, 1]);
		expect(diff.addedIdxes).toEqual([0, 1]);
		expect(diff.modified).toEqual([]);
	});

	describe("diff with space in middle of the world with", () => {
		test("one character space", () => {
			const diff = getDiff(["apple", "i have one banana"], ["apple", "i have one ba nana"]);

			expect(diff.deletedIdxes).toHaveLength(0);
			expect(diff.addedIdxes).toHaveLength(0);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 1, newIdx: 1 },
			]);
		});

		test("multiple strings with one and two char spaces", () => {
			const diff = getDiff(
				["apple", "i have one banana"],
				["apple", "i have one ba  nana", "i have one ba nana"],
			);

			expect(diff.deletedIdxes).toHaveLength(0);
			expect(diff.addedIdxes).toHaveLength(1);
			expect(diff.modified.map((x) => ({ oldIdx: x.oldIdx, newIdx: x.newIdx }))).toEqual([
				{ oldIdx: 1, newIdx: 2 },
			]);
		});

		test("most of string is spaces", () => {
			const diff = getDiff(
				["apple", "i have one banana"],
				["apple", "i have one ba                                  nana"],
			);

			expect(diff.deletedIdxes).toHaveLength(1);
			expect(diff.addedIdxes).toHaveLength(1);
			expect(diff.modified).toHaveLength(0);
		});
	});
});
