import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import { JSONContent } from "@tiptap/core";

type NodeConverter = (
	node: JSONContent,
	ctx: { save; confluencePageUrl: string; data: ConfluenceSourceData },
) => JSONContent | Promise<JSONContent>;

export default NodeConverter;
