import Path from "@core/FileProvider/Path/Path";
import ConfluenceSourceData from "@ext/confluence/actions/Source/model/ConfluenceSourceData";
import { JSONContent } from "@tiptap/core";

type NodeConverter = (node: JSONContent, ctx: { articlePath: Path; save, confluencePageUrl: string, data: ConfluenceSourceData }) => JSONContent | Promise<JSONContent>;

export default NodeConverter
