import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitAttributes from "./GitAttributes";

describe("GitAttributes", () => {
	let mockFp: jest.Mocked<FileProvider>;
	let mockRepo: { path: Path };

	beforeEach(() => {
		mockFp = {
			exists: jest.fn(),
			read: jest.fn(),
			write: jest.fn(),
		} as unknown as jest.Mocked<FileProvider>;

		mockRepo = {
			path: new Path("/test/repo"),
		};
	});

	describe("parse", () => {
		it("should return empty attributes if file does not exist", async () => {
			mockFp.exists.mockResolvedValue(false);

			const result = await GitAttributes.parse(mockRepo as any, mockFp);

			expect(result).toBeInstanceOf(GitAttributes);
			expect(result["_attrs"].size).toBe(0);
		});

		it("should parse existing file with attributes", async () => {
			const gitAttributesContent =
				"*.pdf filter=lfs diff=lfs merge=lfs -text\n*.jpg filter=lfs\n#*.png filter=lfs\n";
			mockFp.exists.mockResolvedValue(true);
			mockFp.read.mockResolvedValue(gitAttributesContent);

			const result = await GitAttributes.parse(mockRepo as any, mockFp);

			expect(result["_attrs"].get("*.pdf")).toEqual({
				attributes: ["filter=lfs", "diff=lfs", "merge=lfs", "-text"],
				disabled: false,
			});
			expect(result["_attrs"].get("*.jpg")).toEqual({
				attributes: ["filter=lfs"],
				disabled: false,
			});
			expect(result["_attrs"].get("*.png")).toEqual({
				attributes: ["filter=lfs"],
				disabled: true,
			});
		});
	});

	describe("setAttr", () => {
		it("should add a new pattern with attribute", () => {
			const attrs = new GitAttributes(new Map(), mockFp, new Path("/test/.gitattributes"));

			attrs.setAttr("*.pdf", "filter=lfs");

			const entry = attrs["_attrs"].get("*.pdf");
			expect(entry).toEqual({
				attributes: ["filter=lfs"],
				disabled: false,
			});
		});

		it("should add attribute to existing pattern", () => {
			const attrs = new GitAttributes(
				new Map([["*.pdf", { attributes: ["filter=lfs"], disabled: false }]]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			attrs.setAttr("*.pdf", "diff=lfs");

			const entry = attrs["_attrs"].get("*.pdf");
			expect(entry?.attributes).toEqual(["filter=lfs", "diff=lfs"]);
		});

		it("should not duplicate existing attribute", () => {
			const attrs = new GitAttributes(
				new Map([["*.pdf", { attributes: ["filter=lfs"], disabled: false }]]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			attrs.setAttr("*.pdf", "filter=lfs");

			const entry = attrs["_attrs"].get("*.pdf");
			expect(entry?.attributes).toEqual(["filter=lfs"]);
		});
	});

	describe("removeAttr", () => {
		it("should remove attribute from pattern", () => {
			const attrs = new GitAttributes(
				new Map([["*.pdf", { attributes: ["filter=lfs", "diff=lfs"], disabled: false }]]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			attrs.removeAttr("*.pdf", "filter=lfs");

			const entry = attrs["_attrs"].get("*.pdf");
			expect(entry?.attributes).toEqual(["diff=lfs"]);
		});

		it("should not fail if attribute does not exist", () => {
			const attrs = new GitAttributes(
				new Map([["*.pdf", { attributes: ["filter=lfs"], disabled: false }]]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			expect(() => attrs.removeAttr("*.pdf", "nonexistent")).not.toThrow();

			const entry = attrs["_attrs"].get("*.pdf");
			expect(entry?.attributes).toEqual(["filter=lfs"]);
		});

		it("should not fail if pattern does not exist", () => {
			const attrs = new GitAttributes(new Map(), mockFp, new Path("/test/.gitattributes"));

			expect(() => attrs.removeAttr("*.nonexistent", "filter=lfs")).not.toThrow();
		});
	});

	describe("setAttrMany", () => {
		it("should add attributes only to specified patterns", () => {
			const attrs = new GitAttributes(
				new Map([
					["*.pdf", { attributes: ["filter=lfs"], disabled: false }],
					["*.jpg", { attributes: ["diff=lfs"], disabled: false }],
					["*.png", { attributes: ["merge=lfs"], disabled: false }],
				]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			attrs.setAttrMany(["*.pdf", "*.png"], "text");

			expect(attrs["_attrs"].get("*.pdf")?.attributes).toContain("text");
			expect(attrs["_attrs"].get("*.jpg")?.attributes).not.toContain("text");
			expect(attrs["_attrs"].get("*.png")?.attributes).toContain("text");
		});

		it("should remove attributes from patterns not in the list", () => {
			const attrs = new GitAttributes(
				new Map([
					["*.pdf", { attributes: ["filter=lfs"], disabled: false }],
					["*.jpg", { attributes: ["filter=lfs"], disabled: false }],
				]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			attrs.setAttrMany(["*.pdf"], "filter=lfs");

			expect(attrs["_attrs"].get("*.pdf")?.attributes).toContain("filter=lfs");
			expect(attrs["_attrs"].get("*.jpg")?.attributes).not.toContain("filter=lfs");
		});
	});

	describe("save", () => {
		it("should remove patterns without attributes when saving", async () => {
			const attrs = new GitAttributes(
				new Map([
					["*.pdf", { attributes: ["filter=lfs"], disabled: false }],
					["*.jpg", { attributes: [], disabled: false }],
					["*.png", { attributes: ["filter=lfs"], disabled: true }],
				]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			// Вызываем метод, который устанавливает _dirty = true
			attrs.setAttr("*.test", "test");

			await attrs.save();

			// Check that write was called
			expect(mockFp.write).toHaveBeenCalledWith(new Path("/test/.gitattributes"), expect.any(String));
			const actualContent = mockFp.write.mock.calls[0][1];
			expect(actualContent).toContain("*.pdf filter=lfs");
			expect(actualContent).toContain("# *.png filter=lfs");
			expect(actualContent).toContain("*.test test");
			// Check that *.jpg is not saved (empty attributes)
			expect(actualContent).not.toContain("*.jpg");
		});

		it("should not save if no changes", async () => {
			const attrs = new GitAttributes(
				new Map([["*.pdf", { attributes: ["filter=lfs"], disabled: false }]]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			await attrs.save();

			expect(mockFp.write).not.toHaveBeenCalled();
		});
	});

	describe("findPatternsByAttr", () => {
		it("should find patterns by attribute", () => {
			const attrs = new GitAttributes(
				new Map([
					["*.pdf", { attributes: ["filter=lfs", "diff=lfs"], disabled: false }],
					["*.jpg", { attributes: ["filter=lfs"], disabled: false }],
					["*.png", { attributes: ["merge=lfs"], disabled: true }],
				]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			const patterns = attrs.findPatternsByAttr("filter=lfs");

			expect(patterns).toEqual(["*.pdf", "*.jpg"]);
		});

		it("should not return disabled patterns", () => {
			const attrs = new GitAttributes(
				new Map([
					["*.pdf", { attributes: ["filter=lfs"], disabled: false }],
					["*.png", { attributes: ["filter=lfs"], disabled: true }],
				]),
				mockFp,
				new Path("/test/.gitattributes"),
			);

			const patterns = attrs.findPatternsByAttr("filter=lfs");

			expect(patterns).toEqual(["*.pdf"]);
		});
	});
});
