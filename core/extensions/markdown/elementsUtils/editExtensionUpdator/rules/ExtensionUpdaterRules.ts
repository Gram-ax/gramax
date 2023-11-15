import { Attribute } from "@tiptap/core";
import { ExtensionFilter } from "./ExtensionFilter";

export default interface ExtensionUpdaterRules {
	filter?: ExtensionFilter;
	attributes?: { [key: string]: Partial<Attribute> };
	options?: { [key: string]: any };
}
