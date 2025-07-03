import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import useCloneHandler from "@ext/git/actions/Clone/logic/useCloneHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import getUrlFromShareData from "@ext/git/core/GitPathnameHandler/clone/logic/getUrlFromShareData";
import type GitShareData from "@ext/git/core/model/GitShareData";
import type { PublicGitStorageData } from "@ext/git/core/model/GitStorageData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { ComponentProps, useCallback, useEffect } from "react";

const useClonePublic = () => {
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const { isReadOnly } = pageDataContext.conf;

	const clone = useCloneHandler();

	return useCallback(async () => {
		const shareData = pageDataContext.shareData as GitShareData;
		pageDataContext.shareData = null;
		if (!router || !shareData || isReadOnly) return;
		if (!shareData.domain || !shareData.group || !shareData.name) return;

		const url = getUrlFromShareData(shareData);
		const redirect = RouterPathProvider.getPathname({
			catalogName: shareData.name,
			filePath: shareData.filePath,
		}).toString();

		const storageData: PublicGitStorageData = {
			name: shareData.name,
			url,
			source: {
				sourceType: SourceType.git,
				userName: "git",
				userEmail: "",
			},
		};

		await clone({
			storageData,
			redirectOnClone: redirect,
			branch: shareData.branch,
			skipCheck: true,
			onStart: () => {
				router.pushPath("/");
			},
		});
	}, [pageDataContext?.shareData]);
};

const usePathnameCloneHandler = () => {
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const publicClone = useClonePublic();
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		if (!router || !pageDataContext?.shareData || isReadOnly) return;
		const shareData = pageDataContext.shareData;
		const isPublic = shareData.isPublic;

		if (isPublic) {
			if (typeof window !== "undefined" && !window.desktopOpened) publicClone();
		} else {
			pageDataContext.shareData = null;
			ModalToOpenService.setValue<ComponentProps<typeof CloneHandler>>(ModalToOpen.CloneHandler, {
				shareData,
			});
		}
	}, [pageDataContext?.shareData]);
};

export default usePathnameCloneHandler;
