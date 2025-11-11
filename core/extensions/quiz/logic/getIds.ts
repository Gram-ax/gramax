import { Article } from "@core/FileStructue/Article/Article";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { createHash } from "crypto";

export const getTestId = async (articleId: string, gvc: GitVersionControl) => {
	const headCommit = (await gvc.getHeadCommit()).toString();
	return `${headCommit.slice(0, 8)}${articleId.slice(0, 8)}`;
};

export const getArticleId = (article: Article) => {
	return createHash("sha256").update(article.ref.path.toString()).digest("hex").slice(0, 16);
};
