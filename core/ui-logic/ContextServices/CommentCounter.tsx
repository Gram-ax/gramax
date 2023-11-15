import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { DependencyList, Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";

const CommentContext = createContext<{ [articlePath: string]: number }>(undefined);

let _setComments: Dispatch<SetStateAction<{ [articlePath: string]: number }>>;

abstract class CommentCounterService {
	public static Provider({ children, deps }: { children: JSX.Element; deps?: DependencyList }): JSX.Element {
		const [comments, setComments] = useState<{ [articlePath: string]: number }>({});
		_setComments = setComments;

		const apiUrlCreator = ApiUrlCreatorService.value;
		const { isLogged, conf } = PageDataContextService.value;

		useEffect(() => {
			if (!isLogged || conf.isServerApp) return;
			CommentCounterService.load(apiUrlCreator);
		}, deps ?? []);

		return <CommentContext.Provider value={comments}>{children}</CommentContext.Provider>;
	}

	static get value() {
		return useContext(CommentContext);
	}

	public static async load(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getNavigationUnresolvedCommentsCount();
		const res = await FetchService.fetch<{ [articlePath: string]: number }>(url);
		if (!res.ok) return;
		const comments = await res.json();
		_setComments(comments);
	}

	public static delete(comments: { [articlePath: string]: number }, articlePath: string) {
		if (comments[articlePath] == 0) return;
		comments[articlePath] = comments[articlePath] - 1;
		_setComments(Object.assign({}, comments));
	}

	public static add(comments: { [articlePath: string]: number }, articlePath: string) {
		if (!comments[articlePath]) comments[articlePath] = 1;
		else comments[articlePath] = comments[articlePath] + 1;
		_setComments(Object.assign({}, comments));
	}
}

export default CommentCounterService;
