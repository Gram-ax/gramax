import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import t from "@ext/localization/locale/translate";
import { span } from "@ext/loggers/opentelemetry";
import { clearAllPlugins, getPluginIsReady, loadPlugins, makePluginReady } from "@plugins/store";
import { toast } from "@ui-kit/Toast";
import { useEffect } from "react";
import {
	ensureWorkspacePluginsLoaded,
	resetWorkspacePluginBootstrap,
	type WorkspacePluginsResponse,
} from "./WorkspacePluginBootstrap";

interface UseClientWorkspacePluginsOptions {
	pageProps?: {
		context?: {
			conf?: { basePath?: string; enterprise?: { gesUrl?: string } };
			workspace?: { current?: string };
		};
	} | null;
	platform: string;
}

export const useClientWorkspacePlugins = ({ pageProps, platform }: UseClientWorkspacePluginsOptions) => {
	const enabled = platform === "next";
	const basePath = pageProps?.context?.conf?.basePath ?? "";
	const workspacePath = pageProps?.context?.workspace?.current;
	const gesUrl = pageProps?.context?.conf?.enterprise?.gesUrl;

	useEffect(() => {
		if (!enabled) return;

		const apiUrlCreator = new ApiUrlCreator(basePath, null, null);

		void ensureWorkspacePluginsLoaded({
			workspacePath,
			props: gesUrl ? { gesUrl } : undefined,
			getPlugins: async (path) => {
				const response = await FetchService.fetch<WorkspacePluginsResponse>(
					apiUrlCreator.getPlugins(path),
					null,
					MimeTypes.json,
				);
				return response.json();
			},
			clearAllPlugins,
			loadPlugins,
			makePluginReady,
			getPluginIsReady,
			onPluginLoadError: (pluginName) =>
				toast(t("plugins.messages.load-error").replace("{name}", pluginName), { status: "error" }),
			onError: (error) => span()?.recordException(error as Error),
		});

		return () => resetWorkspacePluginBootstrap();
	}, [basePath, workspacePath, gesUrl, enabled]);
};
