import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/actions/Import/model/confluenceExtensionTypes";
import { JSONContent } from "@tiptap/core";

const camelToSnake = (str: string): string => {
	return str.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
};

const translateConfluenceName = (node: JSONContent): string => {
	const type = node?.type || "";

	if (CONFLUENCE_EXTENSION_TYPES.includes(type)) return camelToSnake(node?.attrs["extensionKey"] || type);

	return camelToSnake(type);
};

export default translateConfluenceName;
