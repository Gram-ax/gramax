import { Tokenizer } from "@ext/markdown/core/render/logic/Markdoc";
import getTagElementRenderModels from "@ext/markdown/core/render/logic/getRenderElements/getTagElementRenderModels";
import TestData from "./test/TestData.json";

const getMdContent = () => `
* [x] Просто текст

* [ ] [ссылка](https://example.com)

* [X] **жирный**

* [ ] > заметка

* [x] <note>

   заметка

   </note>

- Просто пункт
`;

const toPlainToken = (token) => {
	return {
		type: token.type,
		tag: token.tag,
		attrs: token.attrs,
		content: token.content,
		children: token.children ? token.children.map(toPlainToken) : null,
	};
};

test("taskListPlugin", () => {
	const tags = getTagElementRenderModels();
	const tokenizer = new Tokenizer({ linkify: false }, tags);

	const tokens = tokenizer.tokenize(getMdContent());
	const plainTokens = tokens.map(toPlainToken);
	expect(plainTokens).toEqual(TestData);
});
