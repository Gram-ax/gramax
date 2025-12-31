import { useEffect, useState } from "react";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import t from "@ext/localization/locale/translate";
import { toast } from "@ui-kit/Toast";
import { loadPlugins, PluginConfig } from "../index";

export interface GetPluginsResponse {
	plugins: PluginConfig[];
	errors: string[];
}

export interface UsePluginLoaderOptions {
	basePath: string;
	workspacePath: WorkspacePath;
	gesUrl?: string;
	enabled?: boolean;
}

export const usePluginLoader = ({ basePath, workspacePath, gesUrl, enabled = true }: UsePluginLoaderOptions) => {
	const [pluginsLoaded, setPluginsLoaded] = useState(false);

	useEffect(() => {
		if (!workspacePath || !enabled) {
			setPluginsLoaded(true);
			return;
		}

		setPluginsLoaded(false);

		const fetchPlugins = async () => {
			try {
				const apiUrlCreator = new ApiUrlCreator(basePath, null, null);
				const url = apiUrlCreator.getPlugins(workspacePath);

				const response = await FetchService.fetch<GetPluginsResponse>(url, null, MimeTypes.json);
				const { plugins, errors } = await response.json();

				for (const pluginName of errors) {
					toast(t("plugins.messages.load-error").replace("{name}", pluginName), { status: "error" });
				}

				if (plugins.length) {
					await loadPlugins(plugins, { gesUrl });
				}
			} catch (error) {
				console.error("Failed to load plugins:", error);
			} finally {
				setPluginsLoaded(true);
			}
		};

		void fetchPlugins();
	}, [basePath, workspacePath, gesUrl, enabled]);

	return {
		pluginsLoaded,
	};
};
