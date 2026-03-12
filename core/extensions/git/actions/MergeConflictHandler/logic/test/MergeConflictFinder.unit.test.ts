import { findMergeConflict } from "@ext/git/actions/MergeConflictHandler/logic/MergeConflictFinder";

describe("MergeConflictFinder", () => {
	it("should return empty array for empty string", () => {
		const result = findMergeConflict("");
		expect(result).toEqual([]);
	});

	it("should return empty array for text without merge conflicts", () => {
		const text = "This is a normal text without any merge conflicts";
		const result = findMergeConflict(text);
		expect(result).toEqual([]);
	});

	it("should find merge conflict with content in both versions", () => {
		const text = `Some text before
<<<<<<< HEAD
This is the current version
=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "This is the current version",
				bottomText: "This is the incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should find merge conflict with empty current version", () => {
		const text = `Some text before
<<<<<<< HEAD
=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "",
				bottomText: "This is the incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should find merge conflict with empty incoming version", () => {
		const text = `Some text before
<<<<<<< HEAD
This is the current version
=======
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "This is the current version",
				bottomText: "",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should find merge conflict with both versions empty", () => {
		const text = `Some text before
<<<<<<< HEAD
=======
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "",
				bottomText: "",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should find merge conflict with multiline content", () => {
		const text = `Some text before
<<<<<<< HEAD
Line 1 of current version
Line 2 of current version
Line 3 of current version
=======
Line 1 of incoming version
Line 2 of incoming version
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Line 1 of current version\nLine 2 of current version\nLine 3 of current version",
				bottomText: "Line 1 of incoming version\nLine 2 of incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should find all merge conflicts when multiple conflicts exist", () => {
		const text = `Some text before
<<<<<<< HEAD
First conflict - current
=======
First conflict - incoming
>>>>>>> branch1
Some text between
<<<<<<< HEAD
Second conflict - current
=======
Second conflict - incoming
>>>>>>> branch2
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "First conflict - current",
				bottomText: "First conflict - incoming",
				bottomRevision: "branch1",
			},
			{
				topRevision: "HEAD",
				topText: "Second conflict - current",
				bottomText: "Second conflict - incoming",
				bottomRevision: "branch2",
			},
		]);
	});

	it("should handle merge conflict with different branch names", () => {
		const text = `Some text before
<<<<<<< HEAD
Current version content
=======
Incoming version content
>>>>>>> feature/new-feature
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Current version content",
				bottomText: "Incoming version content",
				bottomRevision: "feature/new-feature",
			},
		]);
	});

	it("should handle merge conflict with special characters in content", () => {
		const text = `Some text before
<<<<<<< HEAD
Content with special chars: !@#$%^&*()
=======
More special chars: <>{}[]|\\/
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Content with special chars: !@#$%^&*()",
				bottomText: "More special chars: <>{}[]|\\/",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should handle merge conflict with different line endings", () => {
		const text = `Some text before\r
<<<<<<< HEAD\r
Current version\r
=======\r
Incoming version\r
>>>>>>> branch-name\r
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Current version",
				bottomText: "Incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should handle merge conflict with complex revision names", () => {
		const text = `Some text before
<<<<<<< feature/user-authentication
User authentication logic
=======
Updated authentication with OAuth
>>>>>>> feature/oauth-integration
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "feature/user-authentication",
				topText: "User authentication logic",
				bottomText: "Updated authentication with OAuth",
				bottomRevision: "feature/oauth-integration",
			},
		]);
	});

	it("should handle merge conflict with whitespace in revisions", () => {
		const text = `Some text before
<<<<<<< HEAD 
Current version with trailing space
=======
Incoming version
>>>>>>> branch-name  
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD ",
				topText: "Current version with trailing space",
				bottomText: "Incoming version",
				bottomRevision: "branch-name  ",
			},
		]);
	});

	describe("should handle merge conflict with empty revision names", () => {
		test("in middle of text", () => {
			const text = `Some text before
<<<<<<<
Current version
=======
Incoming version
>>>>>>>
Some text after`;

			const result = findMergeConflict(text);
			expect(result).toEqual([
				{
					topRevision: "",
					topText: "Current version",
					bottomText: "Incoming version",
					bottomRevision: "",
				},
			]);
		});
		test("at the end of text", () => {
			const text = `Some text before
<<<<<<<
Current version
=======
Incoming version
>>>>>>>`;

			const result = findMergeConflict(text);
			expect(result).toEqual([
				{
					topRevision: "",
					topText: "Current version",
					bottomText: "Incoming version",
					bottomRevision: "",
				},
			]);
		});
	});

	it("should handle merge conflict at the beginning of text", () => {
		const text = `<<<<<<< HEAD
Current version
=======
Incoming version
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Current version",
				bottomText: "Incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should handle merge conflict at the end of text", () => {
		const text = `Some text before
<<<<<<< HEAD
Current version
=======
Incoming version
>>>>>>> branch-name`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "Current version",
				bottomText: "Incoming version",
				bottomRevision: "branch-name",
			},
		]);
	});

	it("should handle merge conflict with only whitespace content", () => {
		const text = `Some text before
<<<<<<< HEAD
   
=======
  
>>>>>>> branch-name
Some text after`;

		const result = findMergeConflict(text);
		expect(result).toEqual([
			{
				topRevision: "HEAD",
				topText: "   ",
				bottomText: "  ",
				bottomRevision: "branch-name",
			},
		]);
	});
});
