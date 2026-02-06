import type { PaginateIntoPagesOptions } from "@ext/print/types";
import { ArticlePreview, PdfExportProgress, PdfPrintParams, PrintableContent } from "@ext/print/types";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import printHandlers from "@ext/print/utils/pagination/nodeHandlers";
import { ControlInfo } from "@ext/print/utils/pagination/types";
// import { countTopLevelTableRows } from "../../markdown/elements/table/print/tablePagination";
import { throwIfAborted } from "./pagination/abort";
import PagePaginator from "./pagination/PagePaginator";
import { createPage, PAGE_CLASS } from "./pagination/pageElements";
import type { ProgressTracker } from "./pagination/progress";
import { createProgressTracker } from "./pagination/progress";
import { createChunkScheduler, nextFrame } from "./pagination/scheduling";
import { getTitlePageContent, TITLE_PAGE_CLASS } from "./pagination/titlePage";
import { initTocPageContent } from "./tocPage/initTocPageContent";

async function paginateIntoPages(
	source: HTMLElement,
	pages: HTMLElement,
	params: PdfPrintParams,
	printableContent: PrintableContent<ArticlePreview>,
	onDone?: VoidFunction,
	onProgress?: (progress: PdfExportProgress) => void,
	options: PaginateIntoPagesOptions = {},
): Promise<void> {
	const { signal, throttleUnits } = options;
	throwIfAborted(signal);
	pages.innerHTML = "";
	const title = printableContent.title ?? "None title";

	throwIfAborted(signal);

	if ((document as any).fonts?.ready) {
		await (document as any).fonts.ready;
	}
	throwIfAborted(signal);

	const getCountPrintPages = () => pages.querySelectorAll(`.${PAGE_CLASS}`).length;

	const yieldTick = createChunkScheduler(24, signal);
	await nextFrame();
	throwIfAborted(signal);

	let currentPage = createPage(pages);
	PagePaginator.setUsablePageHeight(currentPage);

	const nodeDimension = await NodeDimensions.init(source, yieldTick, () => throwIfAborted(signal));

	const totalUnits = source.childElementCount; //+ countTopLevelTableRows(source, nodeDimension);
	const progressTracker: ProgressTracker = createProgressTracker({
		totalUnits,
		reporter: onProgress,
		countPrintPages: getCountPrintPages,
		throttleUnits,
	});
	progressTracker.emit(true);

	const controlInfo: ControlInfo = {
		yieldTick,
		progress: progressTracker,
		signal,
	};

	const paginationInfo = {
		printHandlers,
		accumulatedHeight: NodeDimensions.createInitial(),
		nodeDimension,
	};

	const paginator = new PagePaginator(source, { paginationInfo, pages, controlInfo });
	await paginator.paginateNode(currentPage);

	if (params.tocPage) initTocPageContent(pages, printableContent.items, params.titlePage);
	throwIfAborted(signal);

	if (params.titlePage) {
		const { titleElement, topElement, bottomElement } = getTitlePageContent(title);
		currentPage = createPage(pages, { isTitle: true, prepend: true });
		currentPage.classList.add(TITLE_PAGE_CLASS);
		currentPage.appendChild(topElement);
		currentPage.appendChild(titleElement);
		currentPage.appendChild(bottomElement);

		await yieldTick();
		throwIfAborted(signal);
	}

	onProgress?.({
		stage: "exporting",
		ratio: 0.99,
		cliMessage: `done-print-document-${getCountPrintPages()}`,
	});
	onDone?.();
}

export default paginateIntoPages;
