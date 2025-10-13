import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import UserInfo from "@ext/security/logic/User/UserInfo";
import {
	DependencyList,
	Dispatch,
	SetStateAction,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import FetchService from "@core-ui/ApiServices/FetchService";

export type AuthoredComments = { total: number; pathnames: CommentsByArticle };

export type CommentsByArticle = { [pathname: string]: string[] };

export type AuthoredCommentsByAuthor = { [author: string]: AuthoredComments };

const CommentContext = createContext<AuthoredCommentsByAuthor>(undefined);

let _setComments: Dispatch<SetStateAction<AuthoredCommentsByAuthor>>;

abstract class CommentCounterService {
	public static Provider({ children, deps }: { children: JSX.Element; deps?: DependencyList }): JSX.Element {
		const { isNext, isStatic, isStaticCli } = usePlatform();
		const [comments, setComments] = useState<AuthoredCommentsByAuthor>({});
		_setComments = setComments;
		const { call: getCommentsByAuthorsApi } = useApi<AuthoredCommentsByAuthor>({
			url: (api) => api.getCommentsByAuthors(),
			parse: "json",
		});

		const load = useCallback(async () => {
			const comments = (await getCommentsByAuthorsApi()) || {};
			_setComments(comments);
		}, [getCommentsByAuthorsApi]);

		useEffect(() => {
			if (isNext || isStatic || isStaticCli) return;
			load();
		}, deps ?? []);

		return <CommentContext.Provider value={comments}>{children}</CommentContext.Provider>;
	}

	static get value() {
		return useContext(CommentContext);
	}

	public static delete(comments: AuthoredCommentsByAuthor, pathname: string, author: UserInfo, deleteId: string) {
		if (!comments[author?.mail]) return;
		comments[author.mail].total--;

		const withoutDeleteId = comments[author.mail].pathnames[pathname]?.filter((id) => id !== deleteId);
		if (!withoutDeleteId) return;

		comments[author.mail].pathnames[pathname] = withoutDeleteId;
		if (withoutDeleteId.length === 0) delete comments[author.mail].pathnames[pathname];

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
