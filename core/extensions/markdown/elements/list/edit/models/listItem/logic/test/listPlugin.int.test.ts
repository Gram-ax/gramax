import getTagElementRenderModels from "@ext/markdown/core/render/logic/getRenderElements/getTagElementRenderModels";
import { Tokenizer } from "@ext/markdown/core/render/logic/Markdoc";
import TestData from "./ListTestData.json";

const getMdContent = () => `
1. - nested same line

- 1. nested same line

1.
- nested after one newline

1.
   - nested after one newline

1.
2. next same-type

1.

- separated by blank line

- - text that starts with dash

1. 2. inside content

	1.    - nested with spaces

1.	- nested with tab

-*- not a marker, just text

-
- next bullet after newline (same type)

1.
* nested with star after number

- [ ] - inner dash after checkbox

1.
10. next numbered

1. some text - looks like marker later

1.
	 - indented nested


- parent
	- child

-
  
1. after blank line
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

test("listPlugin - split invalid list_item", () => {
	const tags = getTagElementRenderModels();
	const tokenizer = new Tokenizer({ linkify: false }, tags);

	const tokens = tokenizer.tokenize(getMdContent());
	const plainTokens = tokens.map(toPlainToken);
	expect(plainTokens).toEqual(TestData);
});
