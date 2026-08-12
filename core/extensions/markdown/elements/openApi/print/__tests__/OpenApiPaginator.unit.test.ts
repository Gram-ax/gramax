/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks */
import OpenApiPaginator from "@ext/markdown/elements/openApi/print/OpenApiPaginator";
import openApiHandler from "@ext/markdown/elements/openApi/print/openApiHandler";
import type { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import PagePaginator from "@ext/print/utils/pagination/PagePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { createPage } from "@ext/print/utils/pagination/pageElements";

jest.mock("@ext/print/utils/pagination/abort", () => ({
	throwIfAborted: jest.fn(),
}));

/** One block as the viewer renders it: page shell, intro, grid, one tag section, `operations` cards. */
const buildBlock = (operations: number): HTMLElement => {
	const block = document.createElement("div");
	block.dataset.testid = "open-api";
	block.innerHTML = `
		<openapi-doc>
			<main class="page">
				<header class="doc-header"><h2>Posts</h2></header>
				<div class="operations-toolbar"><h3 class="operations-title">Operations</h3></div>
				<div class="grid">
					<api-section data-index="0">
						<div class="section-head">Posts</div>
						<div class="section-body"><div class="section-inner"><div class="operation-stack">
							${Array.from({ length: operations }, (_, i) => `<api-operation data-index="${i}">op ${i}</api-operation>`).join("")}
						</div></div></div>
					</api-section>
					<api-models><section class="models-section">Schemas</section></api-models>
				</div>
			</main>
		</openapi-doc>`;
	return block;
};

/** An operation card is 40 of the 100 usable units; the block as a whole is far past a page on its own. */
const ITEM_HEIGHT = 40;
const heightOf = (node: HTMLElement): number => (node.tagName === "API-OPERATION" ? ITEM_HEIGHT : 400);

describe("OpenApiPaginator", () => {
	beforeEach(() => {
		const dimensions = {
			get: jest.fn((node: HTMLElement) => ({
				height: heightOf(node),
				marginTop: 0,
				marginBottom: 0,
				paddingH: 0,
			})),
			canUpdateAccumulatedHeight: jest.fn(
				(node: HTMLElement, height: number) =>
					Paginator.paginationInfo.accumulatedHeight.height + heightOf(node) <= height,
			),
			updateAccumulatedHeightNode: jest.fn((node: HTMLElement) => ({
				height: Paginator.paginationInfo.accumulatedHeight.height + heightOf(node),
				marginBottom: 0,
			})),
			updateAccumulatedHeightDim: jest.fn(() => Paginator.paginationInfo.accumulatedHeight),
		} as unknown as jest.Mocked<NodeDimensions>;

		Paginator.controlInfo = {
			signal: undefined,
			progress: { increase: jest.fn(), emit: jest.fn() },
			yieldTick: jest.fn().mockResolvedValue(undefined),
		} as any;
		Paginator.paginationInfo = {
			nodeDimension: dimensions,
			accumulatedHeight: { height: 0, marginBottom: 0 },
			printHandlers: { required: [], conditional: [openApiHandler.handle] },
		} as any;
		Paginator.printPageInfo = { usablePageHeight: 100, pages: document.createElement("div") } as any;
	});

	const paginate = async (operations: number) => {
		const source = document.createElement("div");
		source.appendChild(buildBlock(operations));
		const pages = document.createElement("div");
		jest.spyOn(PagePaginator, "setUsablePageHeight").mockImplementation(() => undefined);

		const paginator = new PagePaginator(source, {
			paginationInfo: Paginator.paginationInfo,
			pages,
			controlInfo: Paginator.controlInfo,
		});
		const firstPage = createPage(pages);
		await paginator.paginateNode(firstPage);
		return pages;
	};

	test("recognizes the block by the page shell the viewer renders", () => {
		expect(OpenApiPaginator.contentHost(buildBlock(1))).not.toBeNull();
		expect(OpenApiPaginator.contentHost(document.createElement("div"))).toBeNull();
	});

	test("keeps every operation when the block is taller than one page", async () => {
		const pages = await paginate(6);

		expect(pages.querySelectorAll("api-operation")).toHaveLength(6);
	});

	test("spreads the operations over as many pages as they need", async () => {
		const pages = await paginate(6);
		const holders = new Set(
			[...pages.querySelectorAll("api-operation")].map((op) =>
				[...pages.children].find((page) => page.contains(op)),
			),
		);

		expect(holders.size).toBeGreaterThan(1);
	});

	test("repeats the page shell on every page it spills onto", async () => {
		const pages = await paginate(6);
		const shells = pages.querySelectorAll("openapi-doc");

		expect(shells.length).toBeGreaterThan(1);
		[...shells].slice(1).forEach((shell) => expect(shell.hasAttribute("data-static")).toBe(true));
	});

	test("writes the document intro once, on the page the block opens on", async () => {
		const pages = await paginate(6);

		expect(pages.querySelectorAll(".doc-header")).toHaveLength(1);
		expect(pages.querySelectorAll(".operations-title")).toHaveLength(1);
		expect(pages.querySelectorAll(".section-head")).toHaveLength(1);
	});
});

/**
 * The budget half of pagination, with dimensions that actually accumulate.
 *
 * The suite above mocks `updateAccumulatedHeightDim` as a no-op, so it measures where nodes land but never
 * whether the page had room for them. That is exactly where the first page differed from its continuations:
 * the intro is put back only after the items have been dealt out, so its height was never in the budget.
 */
describe("OpenApiPaginator: budget of the page the block opens on", () => {
	const INTRO_HEIGHT = 30;
	const OPERATION_HEIGHT = 40;
	const PAGE_HEIGHT = 100;

	const measure = (node: HTMLElement): number => {
		if (node.tagName === "API-OPERATION") return OPERATION_HEIGHT;
		if (node.classList.contains("doc-header") || node.classList.contains("operations-toolbar")) return INTRO_HEIGHT;
		// Anything that holds the cards has to overflow a page on its own, or the paginator places it whole
		// and the conditional OpenAPI handler -- the code under test -- is never reached. That covers the
		// block, its shell, and the section: a section that fits keeps its operations together and nothing
		// is ever dealt out one at a time.
		if (
			node.dataset.testid === "open-api" ||
			node.tagName === "OPENAPI-DOC" ||
			node.tagName === "API-SECTION" ||
			node.tagName === "API-MODELS"
		)
			return PAGE_HEIGHT * 4;
		return 0;
	};

	beforeEach(() => {
		const dimensions = {
			get: jest.fn((node: HTMLElement) => ({
				height: measure(node),
				marginTop: 0,
				marginBottom: 0,
				paddingH: 0,
			})),
			canUpdateAccumulatedHeight: jest.fn(
				(node: HTMLElement, height: number) =>
					Paginator.paginationInfo.accumulatedHeight.height + measure(node) <= height,
			),
			updateAccumulatedHeightNode: jest.fn((node: HTMLElement) => ({
				height: Paginator.paginationInfo.accumulatedHeight.height + measure(node),
				marginBottom: 0,
			})),
			// Unlike the suite above this one really accumulates -- otherwise reserving anything is invisible.
			updateAccumulatedHeightDim: jest.fn((dimension: { height: number }) => ({
				height: Paginator.paginationInfo.accumulatedHeight.height + dimension.height,
				marginBottom: 0,
			})),
		} as unknown as jest.Mocked<NodeDimensions>;

		Paginator.controlInfo = {
			signal: undefined,
			progress: { increase: jest.fn(), emit: jest.fn() },
			yieldTick: jest.fn().mockResolvedValue(undefined),
		} as any;
		Paginator.paginationInfo = {
			nodeDimension: dimensions,
			accumulatedHeight: { height: 0, marginBottom: 0 },
			printHandlers: { required: [], conditional: [openApiHandler.handle] },
		} as any;
		Paginator.printPageInfo = { usablePageHeight: PAGE_HEIGHT, pages: document.createElement("div") } as any;
	});

	test("counts the intro against the first page before dealing operations onto it", async () => {
		const source = document.createElement("div");
		source.appendChild(buildBlock(4));
		const pages = document.createElement("div");
		jest.spyOn(PagePaginator, "setUsablePageHeight").mockImplementation(() => undefined);
		const paginator = new PagePaginator(source, {
			paginationInfo: Paginator.paginationInfo,
			pages,
			controlInfo: Paginator.controlInfo,
		});
		await paginator.paginateNode(createPage(pages));

		// Intro is 60 of the 100 usable units, so exactly one 40-unit card fits beside it. Without reserving
		// it the page took two cards and then had the intro prepended on top -- 140 units on a 100-unit page.
		const firstPage = pages.children[0];
		expect(firstPage.querySelectorAll("api-operation")).toHaveLength(1);
		expect(firstPage.querySelectorAll(".doc-header")).toHaveLength(1);
		expect(pages.querySelectorAll("api-operation")).toHaveLength(4);
	});
});
