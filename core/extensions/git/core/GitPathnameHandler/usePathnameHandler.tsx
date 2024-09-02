import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import getPathnameCheckoutData from "@ext/git/core/GitPathnameHandler/checkout/logic/getPathnameCheckoutData";
import useOnPathnameUpdateBranch from "@ext/git/core/GitPathnameHandler/checkout/logic/useOnPathnameUpdateBranch";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import getPathnamePullData from "@ext/git/core/GitPathnameHandler/pull/logic/getPathnamePullData";
import t from "@ext/localization/locale/translate";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { ComponentProps, useEffect } from "react";

const usePathnameHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		if (!isFirstLoad || !isArticle || isReadOnly || !isStorageInitialized) return;
		const handler = async () => {
			const res = await FetchService.fetch<MergeData>(apiUrlCreator.getMergeData());
			if (!res.ok) return;
			const mergeData = await res.json();

			const checkoutData = await getPathnameCheckoutData(apiUrlCreator, new Path(router.path).removeExtraSymbols);

			if (!mergeData.ok) {
				ModalToOpenService.setValue<ComponentProps<typeof MergeConflictConfirm>>(ModalToOpen.MergeConfirm, {
					mergeData,
					errorText: checkoutData.haveToCheckout
						? t("git.merge.confirm.catalog-conflict-state-with-checkout").replace(
								"{{branchToCheckout}}",
								checkoutData.branchToCheckout,
						  )
						: t("git.merge.confirm.catalog-conflict-state"),
					title: t("git.merge.error.catalog-conflict-state"),
				});
				return;
			}

			if (checkoutData.haveToCheckout) {
				ArticleViewService.setDefaultView();
				ModalToOpenService.setValue<ComponentProps<typeof CheckoutHandler>>(ModalToOpen.CheckoutHandler, {
					currentBranchName: checkoutData.currentBranch,
					branchToCheckout: checkoutData.branchToCheckout,
				});
				return;
			}

			ArticleViewService.setLoadingView();
			SyncIconService.start();
			const { haveToPull, canPull } = await getPathnamePullData(apiUrlCreator);
			const exit = () => {
				SyncIconService.stop();
				ArticleViewService.setDefaultView();
			};
			if (!haveToPull) return exit();

			if (canPull) {
				await SyncService.sync(apiUrlCreator);
				return exit();
			}
			exit();
			ModalToOpenService.setValue<ComponentProps<typeof PullHandler>>(ModalToOpen.PullHandler);
		};
		void handler();
	}, [isFirstLoad]);

	useOnPathnameUpdateBranch();
};

export default usePathnameHandler;
