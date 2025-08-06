import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { clearData } from "@core-ui/utils/initGlobalFuncs";
import { uniqueName } from "@core/utils/uniqueName";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useCallback, useState } from "react";

export const useCreateWorkspaceActions = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const workspaces = WorkspaceService.workspaces();
	const pathPlaceholder = WorkspaceService.defaultPath();
	const [open, setOpenInner] = useState(true);

	const [originalProps, setOriginalProps] = useState<ClientWorkspaceConfig>({
		name: "",
		path: uniqueName(
			pathPlaceholder + "/workspace",
			workspaces.map((w) => w.path),
		),
		icon: "",
	});

	const setOpen = useCallback(
		(v: boolean) => {
			if (v) {
				const props = {
					name: "",
					path: uniqueName(
						pathPlaceholder + "/workspace",
						workspaces.map((w) => w.path),
					),
					icon: "",
				};
				setOriginalProps(props);
			}

			setOpenInner(v);
		},
		[pathPlaceholder, workspaces],
	);

	const onSubmit = async (newProps: ClientWorkspaceConfig, closeCallback: () => void) => {
		clearData();
		await FetchService.fetch(apiUrlCreator.createWorkspace(), JSON.stringify(newProps));
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
		onSubmit,
	};
};
