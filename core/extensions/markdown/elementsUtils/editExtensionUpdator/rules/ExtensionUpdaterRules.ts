import type { Attribute } from "@tiptap/core";
import type { ExtensionFilter } from "./ExtensionFilter";

export default interface ExtensionUpdaterRules {
	filter?: ExtensionFilter;
	attributes?: { [key: string]: Partial<Attribute> };
	options?: { [key: string]: any };
}
