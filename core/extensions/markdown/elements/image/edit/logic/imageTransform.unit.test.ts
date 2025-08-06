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
					{ tag: "img", type: "image", attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT}px`]], content: "" },
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
				children: [{ type: "inlineImage", attrs: { height: `${MAX_INLINE_IMAGE_HEIGHT}px`, alt: "" } }],
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
					{ tag: "img", type: "image", attrs: [["height", `${MAX_INLINE_IMAGE_HEIGHT + 1}px`]], content: "" },
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
					{ type: "inlineImage", attrs: { height: `${MAX_INLINE_IMAGE_HEIGHT + 1}px`, alt: "" } },
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
				],
			},
		]);
	});
});
