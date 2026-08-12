import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { useAiCheck } from "@ext/ai/hooks/useAiCheck";
import type { AiServerConfig } from "@ext/ai/models/types";
import { useCallback, useState } from "react";

// AI persistence at the workspace level is funneled through /api/settings/update
// (universal settings pipeline). The backend dispatches the `services.ai.*` slice
// to the per-user cookie-backed AiDataProvider, leaving other workspace keys to
// the YAML store. Read path stays on /api/ai/server/getData because the cookie
// is request-scoped and isn't in the hydrated settings cache.
export const useWorkspaceAi = (workspacePath: string) => {
	const apiUrlCreator = ApiUrlCreator.value;
	const [isSaving, setIsSaving] = useState(false);
	const { checkServer, checkToken, isChecking } = useAiCheck();

	const saveData = useCallback(async (config: AiServerConfig) => {
		try {
			setIsSaving(true);
			const url = apiUrlCreator.getUpdateSettingURL("workspace");
			await FetchService.fetch(
				url,
				JSON.stringify({
					"services.ai.endpoint": config.apiUrl ?? "",
					"services.ai.token": config.token ?? "",
				}),
				MimeTypes.json,
				Method.POST,
			);
		} finally {
			setIsSaving(false);
		}
	}, []);

	const getData = useCallback(async () => {
		const url = apiUrlCreator.getAiData(workspacePath);
		const res = await FetchService.fetch(url);
		if (!res.ok) return;
		const data = await res.json();
		return { aiApiUrl: data.apiUrl, aiToken: data.token };
	}, [workspacePath]);

	return { checkServer, saveData, getData, checkToken, isChecking, isSaving };
};
