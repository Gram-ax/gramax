import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import { JSONContent } from "@tiptap/core";

type HTMLNodeConverter = (
	node: HTMLElement,
	ctx: { save; confluencePageUrl: string; data: ConfluenceSourceData },
) => JSONContent | Promise<JSONContent>;

export default HTMLNodeConverter;
