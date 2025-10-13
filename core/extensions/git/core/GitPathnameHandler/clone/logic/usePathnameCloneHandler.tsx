import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
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

	const { startClone } = useCloneRepo({
		skipCheck: true,
		onStart: () => {
			router.pushPath("/");
		},
	});

	return useCallback(
		async (shareData: GitShareData) => {
			if (!shareData || isReadOnly || !shareData.domain || !shareData.group || !shareData.name) return;

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

			return await startClone({ storageData, branch: shareData.branch, redirectOnClone: redirect });
		},
		[startClone, pageDataContext?.shareData, isReadOnly, router],
	);
};

const usePathnameCloneHandler = () => {
	const router = useRouter();
	const pageDataContext = PageDataContextService.value;
	const startClonePublic = useClonePublic();
	const { isReadOnly } = pageDataContext.conf;

	useEffect(() => {
		const shareData = pageDataContext.shareData;
		if (!router || !shareData || isReadOnly) return;

		const isPublic = shareData.isPublic;

		if (isPublic) {
			if (typeof window !== "undefined" && !window.desktopOpened) {
				startClonePublic(shareData as GitShareData);
			}
		} else {
			ModalToOpenService.setValue<ComponentProps<typeof CloneHandler>>(ModalToOpen.CloneHandler, {
				shareData,
			});
			pageDataContext.shareData = null;
		}
	}, [pageDataContext.shareData, router, isReadOnly]);
};

export default usePathnameCloneHandler;
