import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import UserInfo from "@ext/security/logic/User/UserInfo";
import { DependencyList, Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";

export type AuthoredComments = { total: number; pathnames: CommentsByArticle };

export type CommentsByArticle = { [pathname: string]: number };

export type AuthoredCommentsByAuthor = { [author: string]: AuthoredComments };

const CommentContext = createContext<AuthoredCommentsByAuthor>(undefined);

let _setComments: Dispatch<SetStateAction<AuthoredCommentsByAuthor>>;

abstract class CommentCounterService {
	public static Provider({ children, deps }: { children: JSX.Element; deps?: DependencyList }): JSX.Element {
		const [comments, setComments] = useState<AuthoredCommentsByAuthor>({});
		_setComments = setComments;

		const apiUrlCreator = ApiUrlCreatorService.value;
		const { isLogged, conf } = PageDataContextService.value;

		useEffect(() => {
			if (!isLogged || conf.isReadOnly) return;
			CommentCounterService.load(apiUrlCreator);
		}, deps ?? []);

		return <CommentContext.Provider value={comments}>{children}</CommentContext.Provider>;
	}

	static get value() {
		return useContext(CommentContext);
	}

	public static async load(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getCommentsByAuthors();
		const res = await FetchService.fetch<AuthoredCommentsByAuthor>(url);
		if (!res.ok) return;
		const comments = await res.json();
		_setComments(comments);
	}

	public static delete(comments: AuthoredCommentsByAuthor, pathname: string, author: UserInfo) {
		if (!comments[author.mail]) return;
		comments[author.mail].total--;
		comments[author.mail].pathnames[pathname]--;
		if (comments[author.mail].pathnames[pathname] === 0) delete comments[author.mail].pathnames[pathname];

		_setComments(Object.assign({}, comments));
	}

	public static totalByPathname(pathname: string) {
		return Object.values(CommentCounterService.value).reduce(
			(acc, curr) => acc + (curr.pathnames[pathname] ?? 0),
			0,
		);
	}

	public static add(comments: AuthoredCommentsByAuthor, pathname: string, user: UserInfo) {
		if (!comments[user.mail]) comments[user.mail] = { total: 0, pathnames: {} };
		comments[user.mail].total++;
		comments[user.mail].pathnames[pathname] = (comments[user.mail].pathnames[pathname] ?? 0) + 1;
		_setComments(Object.assign({}, comments));
	}
}

export default CommentCounterService;
