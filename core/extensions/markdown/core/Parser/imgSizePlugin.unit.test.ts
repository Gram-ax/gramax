import { parseImageSize } from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/imgSizePlugin";

describe("imgSizePlugin", () => {
	it("правильно парсит размер изображения", () => {
		const tokenString = "![test](./ljrhwtkjwrlt.png){width=92% height=599px}";
		const result = parseImageSize(tokenString);
		expect(result).toEqual({ width: "92%", height: "599px" });
	});
});
