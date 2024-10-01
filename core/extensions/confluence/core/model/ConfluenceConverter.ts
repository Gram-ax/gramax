import Path from "@core/FileProvider/Path/Path";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import { JSONContent } from "@tiptap/core";

export default interface ConfluenceConverter {
	convert(article: ConfluenceArticle, articlePath: Path): Promise<JSONContent>;
}
