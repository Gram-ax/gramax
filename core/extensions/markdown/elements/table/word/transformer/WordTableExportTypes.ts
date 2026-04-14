import type { ITableRowPropertiesOptions } from "docx";
import type { AddOptionsWord } from "../../../../../wordExport/options/WordTypes";
import type { WordSerializerState } from "../../../../../wordExport/WordExportState";
import type { Tag } from "../../../../core/render/logic/Markdoc";
import type { WordTableExport } from "./WordTableExport";

export type WordTableChild = (
	state: WordSerializerState,
	tag: Tag,
	wordTableExport: WordTableExport,
	addOptions?: TableAddOptionsWord,
) => Promise<any>;

export type TableAddOptionsWord = AddOptionsWord & ITableRowPropertiesOptions;

export type WordTableChildren = Record<string, WordTableChild>;
