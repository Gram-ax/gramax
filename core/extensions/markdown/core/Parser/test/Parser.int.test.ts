import LanguageService from "@core-ui/ContextServices/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import type { RenderableTreeNode } from "../../render/logic/Markdoc";
import { getParserTestData } from "./getParserTestData";
import MarkdownTestData from "./MarkdownTestData.json";

type MarkdownTestDataType = {
	text: { legacy?: string; xml: string };
	renderTree: unknown;
	html: string;
	resources?: string[];
};

jest.mock("react", () => ({
	...jest.requireActual("react"),
	useLayoutEffect: jest.requireActual("react").useEffect,
}));

jest.mock("next/router", () => ({
	useRouter: jest.fn(),
}));

describe("MarkdownParser", () => {
	beforeAll(() => {
		LanguageService.setUiLanguage(UiLanguage.ru);

		global.ResizeObserver = jest.fn().mockImplementation(() => ({
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn(),
		}));
	});

	describe("правильно преобразует компонент", () => {
		for (const [key, value] of Object.entries(MarkdownTestData)) {
			value.forEach((obj: MarkdownTestDataType, idx: number) => {
				describe(`${key} №${idx + 1} в`, () => {
					let result: Awaited<ReturnType<typeof getComponentRenderTreeAndHTML>>;

					beforeAll(async () => {
						result = await getComponentRenderTreeAndHTML(obj.text.xml);
					});

					if (obj.text.legacy)
						test("renderTree из legacy", async () => {
							const { renderTree } = await getComponentRenderTreeAndHTML(obj.text.legacy);
							expect(renderTree).toEqual(obj.renderTree);
						});

					test("renderTree из xml", () => {
						expect(result.renderTree).toEqual(obj.renderTree);
					});

					test("HTML", () => {
						expect(result.html).toEqual(obj.html);
					});

					if (obj.resources)
						test("renderTree из xml", () => {
							expect(result.resources).toBeDefined();
							expect(obj.resources).toBeDefined();

							const resources = result.resources.map((res) => res.value);
							expect(resources?.sort()).toEqual(obj.resources.sort());
						});
				});
			});
		}
	});
});

async function getComponentRenderTreeAndHTML(componentText: string) {
	const { parser, parseContext } = await getParserTestData();
	const content = await parser.parse(componentText, parseContext, "requestURL.com");
	const allRenderTree = content.renderTree;
	const allHTML = await content.getHtmlValue.get();
	const resources = content.parsedContext.getResourceManager().resources;

	return {
		renderTree: getFirstChildren(allRenderTree),
		html: getChildrenHTML(allHTML),
		resources,
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
