import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import openNewTab from "@core-ui/utils/openNewTab";
import { makeGitShareData } from "@ext/git/actions/Clone/logic/makeGitShareData";
import getRepUrl from "@ext/git/core/GitPathnameHandler/clone/logic/getRepUrl";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { MouseEvent, useMemo } from "react";

export const useOpenExternalGitSourceButton = (closeHandler: () => void) => {
	const catalogProps = CatalogPropsService.value;
	const gesUrl = WorkspaceService.current().enterprise?.gesUrl;
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const githubIcon = SourceType.gitHub === sourceType ? "github" : undefined;
	const gitlabIcon = SourceType.gitLab === sourceType ? "gitlab" : undefined;
	const gitverseIcon = SourceType.gitVerse === sourceType ? "gitverse" : undefined;
	const giteaIcon = SourceType.gitea === sourceType ? "gitea" : undefined;

	const gitButtonProps = useMemo(
		() => ({
			shouldRender: !!sourceType && !gesUrl,
			children: `${t("open-in.generic")} ${sourceType}`,
			startIcon: gitlabIcon || githubIcon || gitverseIcon || giteaIcon,
			
			onClick: (e: MouseEvent<HTMLButtonElement>) => {
				e.preventDefault();

				const gitShareData = makeGitShareData(catalogProps.link.pathname);

				openNewTab(getRepUrl(gitShareData).href);
				closeHandler();
			},
		}),
		[sourceType, gesUrl, closeHandler, catalogProps],
	);

	return { gitButtonProps };
};
