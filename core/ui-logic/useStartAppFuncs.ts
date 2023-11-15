import useReviewHandler from "../extensions/catalog/actions/review/logic/useReviewHandler";
import userShareHandler from "../extensions/catalog/actions/share/logic/useShareHandler";
import useRemoveExpiredSources from "../extensions/git/actions/Storage/logic/useRemoveExpariedSources";
import { Router } from "../logic/Api/Router";
import { useRouter } from "../logic/Api/useRouter";

const removeQueryT = (router: Router) => {
	if (typeof document != "undefined" && router?.query?.t) {
		delete router.query.t;
		router.pushQuery(router.query);
	}
};

const closeIfChild = () => {
	if (typeof window == "undefined" || !window.opener) return;
	window.opener.onLoadApp(window.location);
	window.close();
};

const useStartAppFuncs = () => {
	const router = useRouter();

	closeIfChild();
	removeQueryT(router);
	useReviewHandler(router);
	userShareHandler(router);
	useRemoveExpiredSources();
};

export default useStartAppFuncs;
