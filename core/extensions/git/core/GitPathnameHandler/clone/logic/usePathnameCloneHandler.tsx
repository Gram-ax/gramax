import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import { ComponentProps, useEffect } from "react";

const usePathnameCloneHandler = () => {
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		if (!router || !pageDataContext?.shareData || isReadOnly) return;
		ModalToOpenService.setValue<ComponentProps<typeof CloneHandler>>(ModalToOpen.CloneHandler, {
			shareData: pageDataContext.shareData,
		});
	}, [router, pageDataContext?.shareData]);
};

export default usePathnameCloneHandler;
