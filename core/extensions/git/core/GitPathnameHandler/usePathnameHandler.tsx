import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PagePropsUpdateService from "@core-ui/ContextServices/PagePropsUpdate";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import { useRouter } from "@core/Api/useRouter";
import { UnsubscribeToken } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import getPathnameCheckoutData from "@ext/git/core/GitPathnameHandler/checkout/logic/getPathnameCheckoutData";
import useOnPathnameUpdateBranch from "@ext/git/core/GitPathnameHandler/checkout/logic/useOnPathnameUpdateBranch";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import getPathnamePullData from "@ext/git/core/GitPathnameHandler/pull/logic/getPathnamePullData";
import t from "@ext/localization/locale/translate";
import useIsSourceDataValid from "@ext/storage/components/useIsSourceDataValid";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";
import { ComponentProps, useEffect, useRef } from "react";

const usePathnameHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const isSourceValid = useIsSourceDataValid();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const isEditorPathname = RouterPathProvider.isEditorPathname(router.path);
	const haveBeenFirstLoad = useRef(false);

	useOnPathnameUpdateBranch();

	useWatch(() => {
		if (isFirstLoad) haveBeenFirstLoad.current = true;
	}, [isFirstLoad]);

	useEffect(() => {
		if (!isArticle || !isEditorPathname || !isStorageInitialized || !haveBeenFirstLoad.current) return;
		haveBeenFirstLoad.current = false;

		const handler = async () => {
			ArticleViewService.setLoadingView();
			const exit = () => {
				SyncIconService.stop();
				ArticleViewService.setDefaultView();
			};

			const res = await FetchService.fetch<MergeData>(apiUrlCreator.getMergeData());
			if (!res.ok) return exit();
			const mergeData = await res.json();

			const checkoutData = await getPathnameCheckoutData(apiUrlCreator, new Path(router.path).removeExtraSymbols);

			if (!mergeData || !mergeData.ok) {
				tryOpenMergeConflict({
					mergeData,
					errorText: checkoutData.haveToCheckout
						? t("git.merge.confirm.catalog-conflict-state-with-checkout").replace(
								"{{branchToCheckout}}",
								checkoutData.branchToCheckout,
						  )
						: t("git.merge.confirm.catalog-conflict-state"),
					title: t("git.merge.error.catalog-conflict-state"),
				});
				return exit();
			}

			if (checkoutData.haveToCheckout) {
				ArticleViewService.setDefaultView();
				ModalToOpenService.setValue<ComponentProps<typeof CheckoutHandler>>(ModalToOpen.CheckoutHandler, {
					currentBranchName: checkoutData.currentBranch,
					branchToCheckout: checkoutData.branchToCheckout,
				});
				return exit();
			}

			if (!isSourceValid) return exit();

			SyncIconService.start();
			const { haveToPull, canPull } = await getPathnamePullData(apiUrlCreator);

			if (!haveToPull) return exit();

			if (canPull) {
				const unsubcribeToken: { current: UnsubscribeToken } = { current: null };
				PagePropsUpdateService.events.on("update", () => {
					exit();
					PagePropsUpdateService.events.off(unsubcribeToken.current);
				});
				await SyncService.sync(apiUrlCreator);
				return;
			}
			exit();
			ModalToOpenService.setValue<ComponentProps<typeof PullHandler>>(ModalToOpen.PullHandler);
		};
		void handler();
	}, [router.path, isFirstLoad, isArticle, isEditorPathname, isStorageInitialized, isSourceValid, apiUrlCreator]);
};

export default usePathnameHandler;
