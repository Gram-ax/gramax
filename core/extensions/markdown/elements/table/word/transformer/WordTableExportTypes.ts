import { ITableRowPropertiesOptions } from "docx";
import { WordSerializerState } from "../../../../../wordExport/WordExportState";
import { AddOptionsWord } from "../../../../../wordExport/options/WordTypes";
import { Tag } from "../../../../core/render/logic/Markdoc";
import { WordTableExport } from "./WordTableExport";

export type WordTableChild = (
	state: WordSerializerState,
	tag: Tag,
	wordTableExport: WordTableExport,
	addOptions?: TableAddOptionsWord,
) => Promise<any>;

export type TableAddOptionsWord = AddOptionsWord & ITableRowPropertiesOptions;

export type WordTableChildren = Record<string, WordTableChild>;
