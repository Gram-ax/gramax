import { MAX_INLINE_IMAGE_HEIGHT } from "@ext/markdown/elements/inlineImage/edit/models/node";
import imageTransform from "./imageTransform";

describe("imageTransform", () => {
	it("should transform image to inlineImage if height is less than or equal to MAX_INLINE_IMAGE_HEIGHT", () => {
		const tokens = [
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{
						tag: "img",
						type: "image",
						attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT}px`]],
					},
				],
			},
			{ type: "paragraph_close" },
		];
		const result = imageTransform(tokens as any);
		expect(result).toEqual([
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{
						type: "inlineImage",
						attrs: { height: `${MAX_INLINE_IMAGE_HEIGHT}px`, alt: "", comment: { id: null } },
					},
				],
			},
			{ type: "paragraph_close" },
		]);
	});

	it("should transform image to inlineImage if it has text", () => {
		const tokens = [
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{ type: "text", tag: "", content: "test" },
					{
						tag: "img",
						type: "image",
						attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT + 1}px`]],
						content: "",
					},
				],
			},
			{ type: "paragraph_close" },
		];
		const result = imageTransform(tokens as any);
		expect(result).toEqual([
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{ type: "text", tag: "", content: "test" },
					{
						type: "inlineImage",
						attrs: { height: `${MAX_INLINE_IMAGE_HEIGHT + 1}px`, alt: "", comment: { id: null } },
					},
				],
			},
			{ type: "paragraph_close" },
		]);
	});

	it("should transform image to image if it has no text", () => {
		const tokens = [
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{
						tag: "img",
						type: "image",
						attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT + 20}px`]],
						content: "",
					},
				],
			},
			{ type: "paragraph_close" },
		];
		const result = imageTransform(tokens as any);
		expect(result).toEqual([
			{
				type: "image",
				attrs: [
					["height", `${MAX_INLINE_IMAGE_HEIGHT + 20}px`],
					["alt", ""],
					["comment", { id: null }],
				],
			},
		]);
	});

	it("transform image to image with comment", () => {
		const tokens = [
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{ type: "tag_open", meta: { tag: "comment", attributes: [{ name: "id", value: "1" }] } },
					{
						tag: "img",
						type: "image",
						attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT + 1}px`]],
						content: "",
					},
					{ type: "tag_close", meta: { tag: "comment" } },
				],
			},
			{ type: "paragraph_close" },
		];
		const result = imageTransform(tokens as any);

		expect(result).toEqual([
			{
				type: "image",
				attrs: [
					["height", `${MAX_INLINE_IMAGE_HEIGHT + 1}px`],
					["alt", ""],
					["comment", { id: "1" }],
				],
			},
		]);
	});

	it("transform image to inlineImage with comment", () => {
		const tokens = [
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{ type: "text", tag: "", content: "test" },
					{ type: "tag_open", meta: { tag: "comment", attributes: [{ name: "id", value: "1" }] } },
					{
						tag: "img",
						type: "image",
						attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT}px`]],
						content: "",
					},
					{ type: "tag_close", meta: { tag: "comment" } },
				],
			},
			{ type: "paragraph_close" },
		];
		const result = imageTransform(tokens as any);

		expect(result).toEqual([
			{ type: "paragraph_open" },
			{
				type: "inline",
				tag: "",
				children: [
					{ type: "text", tag: "", content: "test" },
					{
						type: "inlineImage",
						attrs: { height: `${MAX_INLINE_IMAGE_HEIGHT}px`, alt: "", comment: { id: "1" } },
					},
				],
			},
			{ type: "paragraph_close" },
		]);
	});
});
