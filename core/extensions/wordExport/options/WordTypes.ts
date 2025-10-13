import type { IParagraphOptions, IRunPropertiesOptions, ParagraphChild } from "docx";
import { FileChild } from "docx/build/file/file-child";
import ParserContext from "../../markdown/core/Parser/ParserContext/ParserContext";
import { RenderableTreeNode, Tag } from "../../markdown/core/render/logic/Markdoc";
import { WordSerializerState } from "../WordExportState";
import { ExportType } from "@ext/wordExport/ExportType";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { JSONContent } from "@tiptap/core";

export type WordBlockChildren = Record<string, WordBlockChild>;

export type WordRenderContext = {
	parserContext?: ParserContext;
	exportType?: ExportType;
	titlesMap: Map<string, TitleInfo>;
	articleName: string;
	order?: string;
	catalog: ContextualCatalog<CatalogProps>;
	itemsFilter: ItemFilter[];
};

export type WordBlockChild = (params: {
	state: WordSerializerState;
	tag: Tag | JSONContent;
	addOptions: AddOptionsWord;
	wordRenderContext: WordRenderContext;
}) => Promise<FileChild[]>;

export type WordInlineChildren = Record<string, WordInlineChild>;

export type WordInlineChild = (params: {
	state: WordSerializerState;
	tag: Tag | JSONContent;
	addOptions: AddOptionsWord;
	wordRenderContext: WordRenderContext;
}) => Promise<ParagraphChild[]>;

export type AddOptionsWord = IRunPropertiesOptions &
	TextRunOptions &
	IParagraphOptions &
	CodeOptions &
	TableMaxWidth &
	MaxPictureWidth &
	TableInsideListItem;

export type TextRunOptions = { readonly break?: number; removeWhiteSpace?: boolean };

export interface Article {
	title: string;
	content: RenderableTreeNode;
}

export interface CodeOptions {
	code?: boolean;
}

export interface TableMaxWidth {
	maxTableWidth?: number;
}

export interface MaxPictureWidth {
	maxPictureWidth?: number;
}

export interface ImageDimensions {
	width: number;
	height: number;
}

export interface TitleInfo {
	title: string;
	order: string;
}

export interface TableInsideListItem {
	insideTableWrapper?: boolean;
	indent?: number;
}
