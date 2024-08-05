import { IParagraphOptions, IRunPropertiesOptions, ParagraphChild } from "docx";
import { FileChild } from "docx/build/file/file-child";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import ResourceManager from "../../../logic/Resource/ResourceManager";
import ParserContext from "../../markdown/core/Parser/ParserContext/ParserContext";
import { RenderableTreeNode, Tag } from "../../markdown/core/render/logic/Markdoc";
import { WordSerializerState } from "../WordExportState";
import { ExportType } from "@ext/wordExport/ExportType";

export type WordBlockChildren = Record<string, WordBlockChild>;

export type WordBlockChild = (params: {
	state: WordSerializerState;
	tag: Tag;
	addOptions: AddOptionsWord;
	resourceManager?: ResourceManager;
	fileProvider?: FileProvider;
	parserContext?: ParserContext;
	exportType?: ExportType;
}) => Promise<FileChild[]>;

export type WordInlineChildren = Record<string, WordInlineChild>;

export type WordInlineChild = (params: {
	state: WordSerializerState;
	tag: Tag;
	addOptions: AddOptionsWord;
	resourceManager: ResourceManager;
	fileProvider: FileProvider;
	exportType?: ExportType;
}) => Promise<ParagraphChild[]>;

export type AddOptionsWord = IRunPropertiesOptions &
	TextRunOptions &
	IParagraphOptions &
	CodeOptions &
	TableMaxWidth &
	MaxPictureWidth;

export type TextRunOptions = { readonly break?: number; removeWhiteSpace?: boolean };

export interface Article {
	title: string;
	content: RenderableTreeNode;
	resourceManager: ResourceManager;
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
