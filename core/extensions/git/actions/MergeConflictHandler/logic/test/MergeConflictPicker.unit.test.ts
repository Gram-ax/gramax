import MergeConflictPicker from "@ext/git/actions/MergeConflictHandler/logic/MergeConflictPicker";

describe("MergeConflictPicker", () => {
	describe("pick", () => {
		it("should return original text when no conflicts exist", () => {
			const text = "This is a normal text without any merge conflicts";
			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(text);
			expect(resultBottom).toBe(text);
		});

		it("should return empty string for empty input", () => {
			const resultTop = MergeConflictPicker.pick("", "top");
			const resultBottom = MergeConflictPicker.pick("", "bottom");
			expect(resultTop).toBe("");
			expect(resultBottom).toBe("");
		});

		it("should pick top version from merge conflict", () => {
			const text = `Some text before
<<<<<<< HEAD
This is the current version
=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

			const result = MergeConflictPicker.pick(text, "top");
			expect(result).toBe(`Some text before
This is the current version
Some text after`);
		});

		it("should pick bottom version from merge conflict", () => {
			const text = `Some text before
<<<<<<< HEAD
This is the current version
=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

			const result = MergeConflictPicker.pick(text, "bottom");
			expect(result).toBe(`Some text before
This is the incoming version
Some text after`);
		});

		it("should handle merge conflict with empty top version", () => {
			const text = `Some text before
<<<<<<< HEAD
=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
Some text after`);
			expect(resultBottom).toBe(`Some text before
This is the incoming version
Some text after`);
		});

		it("should handle merge conflict with empty bottom version", () => {
			const text = `Some text before
<<<<<<< HEAD
This is the current version
=======
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
This is the current version
Some text after`);
			expect(resultBottom).toBe(`Some text before
Some text after`);
		});

		it("should handle merge conflict with both versions empty", () => {
			const text = `Some text before
<<<<<<< HEAD
=======
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
Some text after`);
			expect(resultBottom).toBe(`Some text before
Some text after`);
		});

		it("should handle merge conflict with only newline in top version", () => {
			const text = `Some text before
<<<<<<< HEAD

=======
This is the incoming version
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before

Some text after`);
			expect(resultBottom).toBe(`Some text before
This is the incoming version
Some text after`);
		});

		it("should handle merge conflict with only newline in bottom version", () => {
			const text = `Some text before
<<<<<<< HEAD
This is the current version
=======

>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
This is the current version
Some text after`);
			expect(resultBottom).toBe(`Some text before

Some text after`);
		});

		it("should handle merge conflict with multiple newlines only", () => {
			const text = `Some text before
<<<<<<< HEAD


=======


>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before


Some text after`);
			expect(resultBottom).toBe(`Some text before


Some text after`);
		});

		it("should handle merge conflict with multiline content", () => {
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

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
Line 1 of current version
Line 2 of current version
Line 3 of current version
Some text after`);
			expect(resultBottom).toBe(`Some text before
Line 1 of incoming version
Line 2 of incoming version
Some text after`);
		});

		it("should handle multiple merge conflicts in one text", () => {
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

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
First conflict - current
Some text between
Second conflict - current
Some text after`);
			expect(resultBottom).toBe(`Some text before
First conflict - incoming
Some text between
Second conflict - incoming
Some text after`);
		});

		describe("merge conflict at the beginning of text", () => {
			it("should handle conflict at beginning with plain text (no newline)", () => {
				const text = `<<<<<<< HEAD
Current version
=======
Incoming version
>>>>>>> branch-name
Some text after`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Current version
Some text after`);
				expect(resultBottom).toBe(`Incoming version
Some text after`);
			});

			it("should handle conflict at beginning with text ending with newline", () => {
				const text = `<<<<<<< HEAD
Current version

=======
Incoming version

>>>>>>> branch-name
Some text after`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Current version

Some text after`);
				expect(resultBottom).toBe(`Incoming version

Some text after`);
			});

			it("should handle conflict at beginning with empty text", () => {
				const text = `<<<<<<< HEAD
=======
Incoming version
>>>>>>> branch-name
Some text after`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text after`);
				expect(resultBottom).toBe(`Incoming version
Some text after`);
			});

			it("should handle conflict at beginning with empty text (both versions empty)", () => {
				const text = `<<<<<<< HEAD
=======
>>>>>>> branch-name
Some text after`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text after`);
				expect(resultBottom).toBe(`Some text after`);
			});
		});

		describe("merge conflict at the end of text", () => {
			it("should handle conflict at end with plain text (no newline)", () => {
				const text = `Some text before
<<<<<<< HEAD
Current version
=======
Incoming version
>>>>>>> branch-name`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text before
Current version
`);
				expect(resultBottom).toBe(`Some text before
Incoming version
`);
			});

			it("should handle conflict at end with text ending with newline", () => {
				const text = `Some text before
<<<<<<< HEAD
Current version

=======
Incoming version

>>>>>>> branch-name`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text before
Current version

`);
				expect(resultBottom).toBe(`Some text before
Incoming version

`);
			});

			it("should handle conflict at end with empty text", () => {
				const text = `Some text before
<<<<<<< HEAD
=======
Incoming version
>>>>>>> branch-name`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text before\n`);
				expect(resultBottom).toBe(`Some text before
Incoming version
`);
			});

			it("should handle conflict at end with empty text (both versions empty)", () => {
				const text = `Some text before
<<<<<<< HEAD
=======
>>>>>>> branch-name`;

				const resultTop = MergeConflictPicker.pick(text, "top");
				const resultBottom = MergeConflictPicker.pick(text, "bottom");
				expect(resultTop).toBe(`Some text before\n`);
				expect(resultBottom).toBe(`Some text before\n`);
			});
		});

		it("should handle merge conflict with only whitespace content", () => {
			const text = `Some text before
<<<<<<< HEAD
   
=======
  
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
   
Some text after`);
			expect(resultBottom).toBe(`Some text before
  
Some text after`);
		});

		it("should handle merge conflict with empty revision names", () => {
			const text = `Some text before
<<<<<<<
Current version
=======
Incoming version
>>>>>>>
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
Current version
Some text after`);
			expect(resultBottom).toBe(`Some text before
Incoming version
Some text after`);
		});

		it("should handle merge conflict with different line endings (CRLF)", () => {
			const text = `Some text before\r
<<<<<<< HEAD\r
Current version\r
=======\r
Incoming version\r
>>>>>>> branch-name\r
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before\r
Current version\r
Some text after`);
			expect(resultBottom).toBe(`Some text before\r
Incoming version\r
Some text after`);
		});

		it("should handle merge conflict with special characters in content", () => {
			const text = `Some text before
<<<<<<< HEAD
Content with special chars: !@#$%^&*()
=======
More special chars: <>{}[]|\\/
>>>>>>> branch-name
Some text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Some text before
Content with special chars: !@#$%^&*()
Some text after`);
			expect(resultBottom).toBe(`Some text before
More special chars: <>{}[]|\\/
Some text after`);
		});

		it("should handle merge conflict where top version is only a single newline", () => {
			const text = `Some text before
<<<<<<< HEAD

=======
Incoming version
>>>>>>> branch-name
Some text after`;

			const result = MergeConflictPicker.pick(text, "top");
			expect(result).toBe(`Some text before

Some text after`);
		});

		it("should handle merge conflict where bottom version is only a single newline", () => {
			const text = `Some text before
<<<<<<< HEAD
Current version
=======

>>>>>>> branch-name
Some text after`;

			const result = MergeConflictPicker.pick(text, "bottom");
			expect(result).toBe(`Some text before

Some text after`);
		});

		it("should handle text with multiple empty conflicts", () => {
			const text = `Text before
<<<<<<< HEAD
=======
>>>>>>> branch1
Middle text
<<<<<<< HEAD
=======
>>>>>>> branch2
Text after`;

			const resultTop = MergeConflictPicker.pick(text, "top");
			const resultBottom = MergeConflictPicker.pick(text, "bottom");
			expect(resultTop).toBe(`Text before
Middle text
Text after`);
			expect(resultBottom).toBe(`Text before
Middle text
Text after`);
		});
	});
});
