import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import UserInfo from "@ext/security/logic/User/UserInfo";
import {
	DependencyList,
	Dispatch,
	SetStateAction,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export type AuthoredComments = { total: number; pathnames: CommentsByArticle };

export type CommentsByArticle = { [pathname: string]: string[] };

export type AuthoredCommentsByAuthor = { [author: string]: AuthoredComments };

const CommentContext = createContext<AuthoredCommentsByAuthor>(undefined);

let _setComments: Dispatch<SetStateAction<AuthoredCommentsByAuthor>>;

abstract class CommentCounterService {
	public static Provider({ children, deps }: { children: JSX.Element; deps?: DependencyList }): JSX.Element {
		const { isNext, isStatic, isStaticCli } = usePlatform();
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [comments, setComments] = useState<AuthoredCommentsByAuthor>({});
		_setComments = setComments;

		useEffect(() => {
			if (isNext || isStatic || isStaticCli) return;
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

	public static delete(comments: AuthoredCommentsByAuthor, pathname: string, author: UserInfo, deleteId: string) {
		if (!comments[author?.mail]) return;
		comments[author.mail].total--;
		comments[author.mail].pathnames[pathname] = comments[author.mail].pathnames[pathname].filter(
			(id) => id !== deleteId,
		);
		if (comments[author.mail].pathnames[pathname].length === 0) delete comments[author.mail].pathnames[pathname];

		_setComments(Object.assign({}, comments));
	}

	public static useGetTotalByPathname(pathname: string) {
		const comments = CommentCounterService.value;
		return useMemo(() => CommentCounterService.getTotalByPathname(comments, pathname), [comments, pathname]);
	}

	public static getTotalByPathname(comments: AuthoredCommentsByAuthor, pathname: string) {
		if (!comments) return 0;
		return Object.values(comments).reduce((acc, curr) => acc + (curr.pathnames[pathname]?.length ?? 0), 0);
	}

	public static add(comments: AuthoredCommentsByAuthor, pathname: string, user: UserInfo, newId: string) {
		if (!comments[user.mail]) comments[user.mail] = { total: 0, pathnames: {} };
		if (!comments[user.mail].pathnames[pathname]) comments[user.mail].pathnames[pathname] = [];
		comments[user.mail].total++;
		comments[user.mail].pathnames[pathname].push(newId);
		_setComments(Object.assign({}, comments));
	}
}

export default CommentCounterService;
