import { Article } from "@core/FileStructue/Article/Article";
import { XxHash } from "@core/Hash/Hasher";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";

export const getTestId = async (articleId: number, gvc: GitVersionControl): Promise<number> => {
	const headCommit = (await gvc.getHeadCommit()).toString();
	return XxHash.single(`${headCommit.slice(0, 8)}${articleId.toString().slice(0, 8)}`);
};

export const getArticleId = (article: Article): number => {
	return XxHash.single(article.ref.path.value);
};
