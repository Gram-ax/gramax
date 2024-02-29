import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import { ComponentProps, useEffect } from "react";

const usePathnameCheckoutHandler = (isFirstLoad: boolean) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const { isReadOnly } = pageDataContext.conf;

	const checkoutToBranch = async () => {
		const logicPath = new Path(router.path).removeExtraSymbols;
		if (!RouterPathProvider.isNewPath(logicPath)) return;

		const { branch } = RouterPathProvider.parsePath(logicPath);
		if (!branch) return;

		const res = await FetchService.fetch<BranchData>(apiUrlCreator.getVersionControlCurrentBranchUrl());
		if (!res.ok) return;

		const currentBranchName = (await res.json())?.name;
		if (!currentBranchName) return;

		if (branch !== currentBranchName) {
			ModalToOpenService.setValue<ComponentProps<typeof CheckoutHandler>>(ModalToOpen.CheckoutHandler, {
				href: logicPath.value,
				branchName: branch,
			});
		}
	};

	useEffect(() => {
		if (!isFirstLoad || !isArticle || isReadOnly) return;
		checkoutToBranch();
	}, [isFirstLoad]);

	useEffect(() => {
		const onUpdateBranch = (branch: string, caller: OnBranchUpdateCaller) => {
			const routerPath = new Path(router.path).removeExtraSymbols;
			if (isReadOnly || !RouterPathProvider.isNewPath(routerPath)) return;

			const fromInit = caller === OnBranchUpdateCaller.Init;
			const pathnameData = RouterPathProvider.parsePath(routerPath);
			router.pushPath(
				RouterPathProvider.updatePathnameData(
					pathnameData,
					fromInit ? { branch } : { branch, filePath: null, itemLogicPath: null },
				).value,
			);
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [router.path]);
};

export default usePathnameCheckoutHandler;
