import Path from "@core/FileProvider/Path/Path";
import { PathsMapValue } from "@ext/notion/model/NotionTypes";
import { JSONContent } from "@tiptap/core";

type NotionNodeConverter = (
	node: JSONContent,
	ctx: {
		save;
		convertUnsupported: (node: JSONContent) => JSONContent;
		currentPath: Path;
		pathsMap: Map<string, PathsMapValue>;
	},
) => JSONContent | Promise<JSONContent>;

export default NotionNodeConverter;
