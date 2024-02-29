import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { ComponentProps, useEffect } from "react";

const usePathnamePullHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const modalToOpen = ModalToOpenService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		if (!isFirstLoad || isReadOnly) return;
		const logicPath = new Path(router.path).removeExtraSymbols;
		if (!isArticle || modalToOpen === ModalToOpen.CheckoutHandler) return;
		ModalToOpenService.setValue<ComponentProps<typeof PullHandler>>(ModalToOpen.PullHandler, {
			href: logicPath.value,
			isStorageInitialized,
		});
	}, []);
};

export default usePathnamePullHandler;
