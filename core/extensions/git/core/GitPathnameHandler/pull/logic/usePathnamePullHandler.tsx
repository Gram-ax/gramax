import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { ComponentProps } from "react";

const usePathnamePullHandler = (isFirstLoad: boolean) => {
	const modalToOpen = ModalToOpenService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const pageDataContext = PageDataContextService.value;
	const { isArticle } = pageDataContext;
	const { isReadOnly } = pageDataContext.conf;

	if (
		!isFirstLoad ||
		isReadOnly ||
		!isArticle ||
		!isStorageInitialized ||
		modalToOpen === ModalToOpen.CheckoutHandler
	)
		return;

	ArticleViewService.setLoadingView();
	ModalToOpenService.setValue<ComponentProps<typeof PullHandler>>(ModalToOpen.PullHandler);
};

export default usePathnamePullHandler;
