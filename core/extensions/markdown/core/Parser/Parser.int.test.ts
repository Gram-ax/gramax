import LanguageService from "@core-ui/ContextServices/Language";
import Language from "@ext/localization/core/model/Language";
import { RenderableTreeNode } from "../render/logic/Markdoc";
import MarkdownTestData from "./test/MarkdownTestData.json";
import { getParserTestData } from "./test/getParserTestData";

jest.mock("react", () => ({
	...jest.requireActual("react"),
	useLayoutEffect: jest.requireActual("react").useEffect,
}));

describe("MarkdownParser", () => {
	beforeAll(() => {
		LanguageService.setUiLanguage(Language.ru);
	});

	describe("правильно преобразует компонент", () => {
		for (const [key, value] of Object.entries(MarkdownTestData)) {
			value.forEach((obj: { text: string; renderTree: any; html: string }, idx: number) => {
				describe(`${key} №${idx + 1} в`, () => {
					test("renderTree", async () => {
						const { renderTree } = await getComponentRenderTreeAndHTML(obj.text);
						expect(renderTree).toEqual(obj.renderTree);
					});

					test("HTML", async () => {
						const { html } = await getComponentRenderTreeAndHTML(obj.text);
						expect(obj.html).toContain(html);
					});
				});
			});
		}
	});
});

async function getComponentRenderTreeAndHTML(componentText: string): Promise<{
	renderTree: RenderableTreeNode;
	html: string;
}> {
	const { parser, parseContext } = await getParserTestData();
	const content = await parser.parse(componentText, parseContext, "requestURL.com");
	const allRenderTree = content.renderTree;
	const allHTML = content.htmlValue;
	return {
		renderTree: getFirstChildren(allRenderTree),
		html: getChildrenHTML(allHTML),
	};
}

function getFirstChildren(node: RenderableTreeNode): RenderableTreeNode {
	if (typeof node === "string") return null;
	return node.children[0];
}

function getChildrenHTML(html: string): string {
	const matches = /<article>([\s\S]*?)<\/article>/gm.exec(html);
	if (!matches?.[1]) return "";
	return matches[1];
}
