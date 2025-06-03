import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import openNewTab from "@core-ui/utils/openNewTab";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getRepUrl from "@ext/git/core/GitPathnameHandler/clone/logic/getRepUrl";
import GitShareData from "@ext/git/core/model/GitShareData";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { useMemo, MouseEvent } from "react";
import WorkspaceService from "@core-ui/ContextServices/Workspace";

export const useOpenExternalGitSourceButton = (closeHandler: () => void) => {
	const catalogProps = CatalogPropsService.value;
	const gesUrl = WorkspaceService.current().enterprise?.gesUrl;
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const githubIcon = SourceType.gitHub === sourceType ? "github" : undefined;
	const gitlabIcon = SourceType.gitLab === sourceType ? "gitlab" : undefined;

	const gitlabButtonProps = useMemo(
		() => ({
			shouldRender: !!sourceType && !gesUrl,
			children: `${t("open-in.generic")} ${sourceType}`,
			startIcon: gitlabIcon || githubIcon,
			onClick: (e: MouseEvent<HTMLButtonElement>) => {
				e.preventDefault();

				const pathnameData = RouterPathProvider.parsePath(new Path(catalogProps.link.pathname));
				const gitShareData: GitShareData = {
					sourceType: getPartGitSourceDataByStorageName(pathnameData.sourceName).sourceType,
					domain: pathnameData.sourceName,
					group: pathnameData.group,
					branch: pathnameData.refname,
					name: pathnameData.repo,
					isPublic: false,
					filePath: [],
				};

				openNewTab(getRepUrl(gitShareData).href);
				closeHandler();
			},
		}),
		[sourceType, gesUrl, closeHandler],
	);

	return { gitlabButtonProps };
};
