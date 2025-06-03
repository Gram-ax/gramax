import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { clearData } from "@core-ui/utils/initGlobalFuncs";
import { uniqueName } from "@core/utils/uniqueName";
import t from "@ext/localization/locale/translate";
import { useWorkspaceLogo } from "@ext/workspace/components/useWorkspaceLogo";
import { useWorkspaceStyle } from "@ext/workspace/components/useWorkspaceStyle";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useState, useCallback } from "react";

export const useWorkspaceEditorActions = (initialWorkspace: ClientWorkspaceConfig) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const workspaces = WorkspaceService.workspaces();
	const pathPlaceholder = WorkspaceService.defaultPath();

	const [open, setOpenInner] = useState(false);
	const [deleteInProgress, setDeleteInProgress] = useState(false);
	const {
		confirmChanges: confirmLogo,
		haveChanges: haveLogoChanges,
		...workspaceLogoProps
	} = useWorkspaceLogo(initialWorkspace?.path);

	const {
		confirmChanges: confirmStyle,
		haveChanges: haveStyleChanges,
		...workspaceStyleProps
	} = useWorkspaceStyle(initialWorkspace?.path);

	const [originalProps, setOriginalProps] = useState<ClientWorkspaceConfig>({ ...initialWorkspace });

	const setOpen = useCallback(
		(v: boolean) => {
			if (v) setOriginalProps({ ...initialWorkspace });
			setOpenInner(v);
		},
		[initialWorkspace, pathPlaceholder, workspaces],
	);

	const removeWorkspace = async (closeCallback: () => void) => {
		if (!(await confirm(t("workspace.delete.web")))) return;

		setDeleteInProgress(true);
		clearData();
		await FetchService.fetch(apiUrlCreator.removeWorkspace(originalProps.path));
		await refreshPage();
		closeCallback();
	};

	const onSubmit = async (
		newProps: ClientWorkspaceConfig & { ai?: { token: string } },
		closeCallback: () => void,
	) => {
		if (deleteInProgress) return;

		clearData();
		await FetchService.fetch(apiUrlCreator.editWorkspace(), JSON.stringify(newProps));
		await confirmLogo();
		await confirmStyle();
		await refreshPage();
		closeCallback();
		setOpenInner(false);
	};

	return {
		open,
		setOpen,
		originalProps,
		workspaces,
		pathPlaceholder,
		deleteInProgress,
		removeWorkspace,
		onSubmit,
		workspaceLogoProps,
		workspaceStyleProps,
		haveLogoChanges,
		haveStyleChanges,
	};
};
