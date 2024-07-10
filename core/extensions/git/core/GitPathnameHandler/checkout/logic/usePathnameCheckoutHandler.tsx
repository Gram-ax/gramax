import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { ComponentProps, useEffect } from "react";

const usePathnameCheckoutHandler = (isFirstLoad: boolean) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const { isReadOnly } = pageDataContext.conf;

	const checkoutToBranch = async () => {
		const logicPath = new Path(router.path).removeExtraSymbols;
		if (!RouterPathProvider.isNewPath(logicPath)) return;

		const { branch: branchToCheckout } = RouterPathProvider.parsePath(logicPath);
		if (!branchToCheckout) return;

		const res = await FetchService.fetch<BranchData>(apiUrlCreator.getVersionControlCurrentBranchUrl());
		if (!res.ok) return;

		const currentBranchName = (await res.json())?.name;
		if (!currentBranchName) return;

		if (branchToCheckout !== currentBranchName) {
			ArticleViewService.setDefaultView();
			ModalToOpenService.setValue<ComponentProps<typeof CheckoutHandler>>(ModalToOpen.CheckoutHandler, {
				currentBranchName,
				branchToCheckout,
			});
		}
	};

	useEffect(() => {
		if (!isFirstLoad || !isArticle || isReadOnly || !isStorageInitialized) return;
		void checkoutToBranch();
	}, [isFirstLoad]);

	useEffect(() => {
		const onUpdateBranch = (branch: string, caller: OnBranchUpdateCaller) => {
			const routerPath = new Path(router.path + router.hash).removeExtraSymbols;
			if (isReadOnly || !RouterPathProvider.isNewPath(routerPath)) return;

			const fromInit = caller === OnBranchUpdateCaller.Init;
			const pathnameData = RouterPathProvider.parsePath(routerPath);
			const isLocal = RouterPathProvider.isLocal(pathnameData);
			if (isLocal) return;

			const newPath = RouterPathProvider.updatePathnameData(
				pathnameData,
				fromInit ? { branch } : { branch, filePath: null, itemLogicPath: null },
			).value;

			router.pushPath(newPath);
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [router.path]);
};

export default usePathnameCheckoutHandler;
