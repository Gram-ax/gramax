import resolveModule from "@app/resolveModule/frontend";
import Path from "@core/FileProvider/Path/Path";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { LfsPointerError, type ResourceError } from "@core-ui/ContextServices/ResourceService/errors";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { toast } from "@ui-kit/Toast";
import { useCallback } from "react";

interface OpenUnknownFileProps {
	resourcePath: string;
}

const onError = (err: ResourceError | null) => {
	if (err instanceof LfsPointerError) {
		toast(t("file-not-found"), {
			status: "warning",
			icon: "cloud-alert",
			description: t("git.lfs.file-is-pointer-2"),
			size: "lg",
		});
		return;
	}

	toast(t("file-not-found"), {
		status: "error",
		icon: "triangle-alert",
		description: t("file-download-error-message"),
		size: "lg",
	});
};

export const OpenUnknownFile = ({ resourcePath }: OpenUnknownFileProps) => {
	const workspace = Workspace.current();
	const apiUrlCreator = ApiUrlCreator.value;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const path = new Path(resourcePath);

	const openInSupportedApp = useCallback(async () => {
		if (!catalogName) return onError(null);
		const url = apiUrlCreator.getResourcePathByCatalog(path.value);
		const res = await FetchService.fetch(url);
		if (!res.ok) return onError(null);

		const absolutePath = await res.text();
		try {
			await resolveModule("openInExplorer")?.(new Path(workspace.path).join(new Path(absolutePath)).value);
		} catch (error) {
			onError(error === "lfs-pointer" ? new LfsPointerError(path.value) : null);
			console.error(error);
		}
	}, [apiUrlCreator, catalogName, path, workspace]);

	return (
		<Button onClick={openInSupportedApp} size="sm" startIcon="external-link" variant="outline">
			{t("open-in-supported-app")}
		</Button>
	);
};
