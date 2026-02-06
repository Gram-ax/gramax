import resolveModule from "@app/resolveModule/backend";
import type { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import pdfmake from "@dynamicImports/pdfmake";
import { handleDocumentTree } from "@ext/pdfExport/parseNodesPDF";
import type DocumentTree from "@ext/wordExport/DocumentTree/DocumentTree";
import type { TitleInfo } from "@ext/wordExport/options/WordTypes";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { FONT_FILES, FONTS, FOOTER_CONFIG, STYLES } from "./config";

const HEADLINE_LEVELS = [1, 2, 3, 4] as const;
const FOOTER_NODES_AMOUNT = 3;

class PDFExporter {
	constructor(
		private _nodes: DocumentTree,
		private readonly _titlesMap: Map<string, TitleInfo>,
		private _catalog: ContextualCatalog<CatalogProps>,
		private _itemFilters: ItemFilter[],
	) {}

	async create(): Promise<Buffer> {
		const pdfMake = await pdfmake();

		pdfMake.vfs = {};
		await this._loadFonts(pdfMake);
		pdfMake.fonts = FONTS;

		const content = await this._buildContent();
		const docDefinition = this.buildDocDefinition(content);
		const pdfDocGenerator = pdfMake.createPdf(docDefinition);

		return new Promise((resolve) => pdfDocGenerator.getBuffer(resolve));
	}

	private async _loadFonts(pdfMake: { vfs: { [file: string]: string } }): Promise<void> {
		const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
			const bytes = new Uint8Array(buffer);
			let binary = "";
			for (let i = 0; i < bytes.byteLength; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return btoa(binary);
		};

		await Promise.all(
			FONT_FILES.map(async (fontFile) => {
				const loadFont = resolveModule("pdfLoadFont");
				const buffer = await loadFont(fontFile);
				pdfMake.vfs[fontFile] = arrayBufferToBase64(buffer);
			}),
		);
	}

	private async _buildContent(): Promise<Content> {
		return await handleDocumentTree(this._nodes, this._titlesMap, this._catalog, this._itemFilters);
	}

	private buildDocDefinition(content: Content): TDocumentDefinitions {
		return {
			content,
			footer: (currentPage: number, pageCount: number) => this._generateFooterContent(currentPage, pageCount),
			styles: STYLES,
			pageBreakBefore: (currentNode: any, followingNodesOnPage: any[]) => {
				return (
					currentNode.headlineLevel in HEADLINE_LEVELS && followingNodesOnPage.length === FOOTER_NODES_AMOUNT
				);
			},
		};
	}

	private _generateFooterContent(currentPage: number, pageCount: number): Content {
		return {
			columns: [this._buildLeftFooterColumn(), this._buildRightFooterColumn(currentPage, pageCount)],
			margin: FOOTER_CONFIG.MARGIN,
		};
	}

	private _buildLeftFooterColumn(): Content {
		return {
			text: this._titlesMap.keys().next().value,
			alignment: FOOTER_CONFIG.COLUMNS.LEFT.alignment,
			fontSize: FOOTER_CONFIG.COLUMNS.LEFT.fontSize,
			margin: FOOTER_CONFIG.COLUMNS.LEFT.margin,
		};
	}

	private _buildRightFooterColumn(currentPage: number, pageCount: number): Content {
		return {
			text: `${currentPage} / ${pageCount}`,
			alignment: FOOTER_CONFIG.COLUMNS.RIGHT.alignment,
			fontSize: FOOTER_CONFIG.COLUMNS.RIGHT.fontSize,
			margin: FOOTER_CONFIG.COLUMNS.RIGHT.margin,
		};
	}
}

export default PDFExporter;
