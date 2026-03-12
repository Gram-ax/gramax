import type { MergeConflictInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { GitCommentAutoMerger } from "@ext/markdown/elements/comment/edit/logic/GitCommentAutoMerger";
import * as yaml from "js-yaml";

describe("GitCommentAutoMerger", () => {
	const merger = new GitCommentAutoMerger();

	test("returns true when both paths end with .comments.yaml", () => {
		const conflict: MergeConflictInfo = {
			ours: "path/to/article.comments.yaml",
			theirs: "path/to/article.comments.yaml",
		};

		expect(merger.canProceed(conflict)).toBe(true);
	});

	describe("proceed", () => {
		test("merges common block by newer dateTime and outputs valid YAML", async () => {
			const conflictContent = `<<<<<<< Updated upstream
45rww:
  comment:
    dateTime: '2026-02-04T08:50:32.127Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrth kwrhtlrwt
  answers: []
=======
45rww:
  comment:
    dateTime: '2026-02-04T10:52:50.424Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrjt hwrjktl
  answers: []
HYgXU:
  comment:
    dateTime: '2026-02-04T11:26:02.529Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: rjhtkjrwt
  answers: []
>>>>>>> Stashed changes
`;

			const mergedContent = await merger.proceed(conflictContent);
			const parsed = yaml.load(mergedContent) as Record<
				string,
				{ comment: { dateTime: string; content: string } }
			>;

			expect(parsed).not.toBeNull();
			expect(parsed["45rww"]).toBeDefined();
			expect(parsed["45rww"].comment.dateTime).toBe("2026-02-04T10:52:50.424Z");
			expect(parsed["45rww"].comment.content).toBe("wrjt hwrjktl");
			expect(parsed["45rww"].comment).toMatchObject({
				dateTime: "2026-02-04T10:52:50.424Z",
				content: "wrjt hwrjktl",
				user: { mail: "nikolafreeman1906@gmail.com", name: "Gaurussel" },
			});
		});

		test("result contains only blocks present in both ours and theirs", async () => {
			const conflictContent = `<<<<<<< HEAD
45rww:
  comment:
    dateTime: '2026-02-04T08:50:32.127Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrth kwrhtlrwt
  answers: []
=======
45rww:
  comment:
    dateTime: '2026-02-04T10:52:50.424Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrjt hwrjktl
  answers: []
HYgXU:
  comment:
    dateTime: '2026-02-04T11:26:02.529Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: rjhtkjrwt
  answers: []
>>>>>>> Stashed changes
`;

			const mergedContent = await merger.proceed(conflictContent);
			const parsed = yaml.load(mergedContent) as Record<string, unknown>;

			expect(Object.keys(parsed)).toEqual(["45rww", "HYgXU"]);
			expect(parsed.HYgXU).toBeDefined();
		});

		test("block only in ours is not in result", async () => {
			const conflictContent = `<<<<<<< HEAD
45rww:
  comment:
    dateTime: '2026-02-04T08:50:32.127Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrth kwrhtlrwt
  answers: []
OnlyOurs:
  comment:
    dateTime: '2026-02-04T09:00:00.000Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: only in ours
  answers: []
=======
45rww:
  comment:
    dateTime: '2026-02-04T08:50:32.127Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: wrth kwrhtlrwt
  answers: []
>>>>>>> Stashed changes
`;

			const mergedContent = await merger.proceed(conflictContent);
			const parsed = yaml.load(mergedContent) as Record<string, unknown>;

			expect(Object.keys(parsed)).toEqual(["45rww", "OnlyOurs"]);
			expect(parsed.OnlyOurs).toBeDefined();
		});

		test("answers are merged and sorted by dateTime", async () => {
			const conflictContent = `<<<<<<< HEAD
45rww:
  comment:
    dateTime: '2026-02-04T08:00:00.000Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: main
  answers:
    - dateTime: '2026-02-04T09:00:00.000Z'
      user:
        mail: nikolafreeman1906@gmail.com
        name: Gaurussel
      content: answer first
    - dateTime: '2026-02-04T11:00:00.000Z'
      user:
        mail: nikolafreeman1906@gmail.com
        name: Gaurussel
      content: answer third
=======
45rww:
  comment:
    dateTime: '2026-02-04T08:00:00.000Z'
    user:
      mail: nikolafreeman1906@gmail.com
      name: Gaurussel
    content: main
  answers:
    - dateTime: '2026-02-04T10:00:00.000Z'
      user:
        mail: nikolafreeman1906@gmail.com
        name: Gaurussel
      content: answer second
>>>>>>> Stashed changes
`;

			const mergedContent = await merger.proceed(conflictContent);
			const parsed = yaml.load(mergedContent) as Record<
				string,
				{ comment: unknown; answers: Array<{ dateTime: string; content: string }> }
			>;

			expect(parsed["45rww"].answers).toHaveLength(3);
			expect(parsed["45rww"].answers.map((a) => a.dateTime)).toEqual([
				"2026-02-04T09:00:00.000Z",
				"2026-02-04T10:00:00.000Z",
				"2026-02-04T11:00:00.000Z",
			]);
			expect(parsed["45rww"].answers.map((a) => a.content)).toEqual([
				"answer first",
				"answer second",
				"answer third",
			]);
		});
	});
});
