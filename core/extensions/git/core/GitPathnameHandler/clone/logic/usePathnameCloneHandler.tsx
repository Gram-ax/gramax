import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import { ComponentProps, useEffect } from "react";

const usePathnameCloneHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		if (!router || !isFirstLoad || !pageDataContext?.shareData || isReadOnly) return;
		const logicPath = new Path(router.path).removeExtraSymbols;
		ModalToOpenService.setValue<ComponentProps<typeof CloneHandler>>(ModalToOpen.CloneHandler, {
			shareData: pageDataContext.shareData,
			href: logicPath.value,
		});
	}, [router, isFirstLoad, pageDataContext?.shareData]);
};

export default usePathnameCloneHandler;
