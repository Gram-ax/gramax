import "@core/utils/asyncUtils"; // Import for extending Array.prototype
import { AstComment } from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import CommentsDiff, { HaveDiffFunction } from "@ext/markdown/elements/diff/logic/commentsDiff/CommentsDiff";
import { Pos } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

describe("CommentsDiff", () => {
	describe("getDiff", () => {
		const createPos = (from: number, to: number): Pos => ({ from, to });

		it("should return empty array when both old and new comments are empty", async () => {
			const oldComments: AstComment = {};
			const newComments: AstComment = {};
			const haveDiff: HaveDiffFunction = jest.fn();

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toEqual([]);
			expect(haveDiff).not.toHaveBeenCalled();
		});

		it("should return added comments when new comments exist but old do not", async () => {
			const oldComments: AstComment = {};
			const newComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(20, 30),
			};
			const haveDiff: HaveDiffFunction = jest.fn();

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(2);
			expect(result).toContainEqual({
				type: FileStatus.new,
				id: "comment1",
				pos: createPos(0, 10),
			});
			expect(result).toContainEqual({
				type: FileStatus.new,
				id: "comment2",
				pos: createPos(20, 30),
			});
			expect(haveDiff).not.toHaveBeenCalled();
		});

		it("should return deleted comments when old comments exist but new do not", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(20, 30),
			};
			const newComments: AstComment = {};
			const haveDiff: HaveDiffFunction = jest.fn();

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(2);
			expect(result).toContainEqual({
				type: FileStatus.delete,
				id: "comment1",
				oldPos: createPos(0, 10),
			});
			expect(result).toContainEqual({
				type: FileStatus.delete,
				id: "comment2",
				oldPos: createPos(20, 30),
			});
			expect(haveDiff).not.toHaveBeenCalled();
		});

		it("should return modified comment when haveDiff returns true", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const newComments: AstComment = {
				comment1: createPos(5, 15),
			};
			const haveDiff: HaveDiffFunction = jest.fn().mockResolvedValue(true);

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: FileStatus.modified,
				id: "comment1",
				pos: createPos(5, 15),
				oldPos: createPos(0, 10),
			});
			expect(haveDiff).toHaveBeenCalledTimes(1);
			expect(haveDiff).toHaveBeenCalledWith({
				type: FileStatus.modified,
				id: "comment1",
				pos: createPos(5, 15),
				oldPos: createPos(0, 10),
			});
		});

		it("should not return comment when haveDiff returns false", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const newComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const haveDiff: HaveDiffFunction = jest.fn().mockResolvedValue(false);

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toEqual([]);
			expect(haveDiff).toHaveBeenCalledTimes(1);
			expect(haveDiff).toHaveBeenCalledWith({
				type: FileStatus.modified,
				id: "comment1",
				pos: createPos(0, 10),
				oldPos: createPos(0, 10),
			});
		});

		it("should handle mixed scenarios with added, deleted, and modified comments", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(20, 30),
				comment3: createPos(40, 50),
			};
			const newComments: AstComment = {
				comment1: createPos(0, 10), // unchanged (haveDiff returns false)
				comment2: createPos(25, 35), // modified (haveDiff returns true)
				comment4: createPos(60, 70), // new
			};
			const haveDiff: HaveDiffFunction = jest.fn((comment) => {
				if (comment.id === "comment2") return Promise.resolve(true);
				return Promise.resolve(false);
			});

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(3);
			expect(result).toContainEqual({
				type: FileStatus.delete,
				id: "comment3",
				oldPos: createPos(40, 50),
			});
			expect(result).toContainEqual({
				type: FileStatus.modified,
				id: "comment2",
				pos: createPos(25, 35),
				oldPos: createPos(20, 30),
			});
			expect(result).toContainEqual({
				type: FileStatus.new,
				id: "comment4",
				pos: createPos(60, 70),
			});
			expect(haveDiff).toHaveBeenCalledTimes(2);
		});

		it("should handle synchronous haveDiff function", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const newComments: AstComment = {
				comment1: createPos(5, 15),
			};
			const haveDiff: HaveDiffFunction = jest.fn().mockReturnValue(true);

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: FileStatus.modified,
				id: "comment1",
				pos: createPos(5, 15),
				oldPos: createPos(0, 10),
			});
		});

		it("should handle multiple comments with same positions but different haveDiff results", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(0, 10),
			};
			const newComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(0, 10),
			};
			const haveDiff: HaveDiffFunction = jest.fn((comment) => {
				return Promise.resolve(comment.id === "comment1");
			});

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: FileStatus.modified,
				id: "comment1",
				pos: createPos(0, 10),
				oldPos: createPos(0, 10),
			});
			expect(haveDiff).toHaveBeenCalledTimes(2);
		});

		it("should filter out undefined values from mapAsync results", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const newComments: AstComment = {
				comment1: createPos(0, 10),
			};
			const haveDiff: HaveDiffFunction = jest.fn().mockResolvedValue(false);

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toEqual([]);
			expect(result.every((item) => item !== undefined)).toBe(true);
		});

		it("should handle all comments being modified", async () => {
			const oldComments: AstComment = {
				comment1: createPos(0, 10),
				comment2: createPos(20, 30),
			};
			const newComments: AstComment = {
				comment1: createPos(5, 15),
				comment2: createPos(25, 35),
			};
			const haveDiff: HaveDiffFunction = jest.fn().mockResolvedValue(true);

			const result = await CommentsDiff.getDiff(oldComments, newComments, haveDiff);

			expect(result).toHaveLength(2);
			expect(result.every((item) => item.type === FileStatus.modified)).toBe(true);
			expect(haveDiff).toHaveBeenCalledTimes(2);
		});
	});
});
