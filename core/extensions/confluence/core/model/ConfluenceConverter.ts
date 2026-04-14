import type Path from "@core/FileProvider/Path/Path";
import type { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import type { JSONContent } from "@tiptap/core";

export default interface ConfluenceConverter {
	convert(article: ConfluenceArticle, articlePath: Path): Promise<JSONContent>;
}
