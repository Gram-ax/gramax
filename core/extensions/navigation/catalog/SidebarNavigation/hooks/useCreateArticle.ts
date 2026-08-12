import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { useCallback, useEffect, useRef } from "react";
import { navigationTreeStore, useNavigationTreeStore } from "../store/navigationTreeStore";

/**
 * Reads the router and the api-url context, so it belongs at the tree root — never in a tree item. Both
 * are React contexts, and a context read inside a memoized item defeats the memo: every route change
 * would re-render every item in the catalog.
 *
 * Both go through refs to keep the published callback's identity stable. The router in particular hands
 * back a new object on every render, so a callback depending on it would be rewritten into the store on
 * every render and re-render every item reading it — the same cascade this hook exists to avoid.
 */
export const useProvideCreateArticle = () => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const routerRef = useRef(router);
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const setOnCreateArticle = useNavigationTreeStore((s) => s.setOnCreateArticle);

	routerRef.current = router;
	apiUrlCreatorRef.current = apiUrlCreator;

	const createArticle = useCallback(async (parentId?: string, afterId?: string) => {
		const url = apiUrlCreatorRef.current.createArticle(parentId, afterId);
		const response = await FetchService.fetch(url);
		if (!response.ok) return refreshPage();

		const path = await response.text();
		if (parentId) navigationTreeStore.getState().toggleExpanded(parentId, true);

		const mutable = { preventGoto: false };
		await NavigationEvents.emit("item-create", { path, mutable });

		if (!mutable.preventGoto) routerRef.current.pushPath(path);
	}, []);

	useEffect(() => {
		setOnCreateArticle(createArticle);
		return () => setOnCreateArticle(null);
	}, [createArticle, setOnCreateArticle]);
};

const noop = async () => {};

/** Reads the callback the tree root published. Safe inside memoized items: the reference is stable. */
export const useCreateArticle = () => useNavigationTreeStore((s) => s.onCreateArticle) ?? noop;
