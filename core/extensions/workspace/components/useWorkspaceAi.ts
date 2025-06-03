import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { AiServerConfig } from "@ext/ai/models/types";
import { useState, useCallback, useMemo, useRef, useEffect, MutableRefObject } from "react";

const debounce = <T>(
	callback: () => Promise<T>,
	timeout: number,
	timeoutRef: MutableRefObject<NodeJS.Timeout>,
): Promise<T> => {
	return new Promise((resolve) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			void (async () => {
				try {
					const result = await callback();
					resolve(result);
				} catch (error) {
					resolve(false as T);
				}
			})();
		}, timeout);
	});
};

export const useWorkspaceAi = (workspacePath: string) => {
	const apiUrlCreator = ApiUrlCreator.value;
	const [initialConfig, setInitialConfig] = useState<AiServerConfig>({ apiUrl: "", token: "" });
	const [config, setConfig] = useState<AiServerConfig>({ apiUrl: "", token: "" });
	const serverTimeout = useRef<NodeJS.Timeout>();
	const tokenTimeout = useRef<NodeJS.Timeout>();

	const isEdit = useMemo(() => initialConfig && initialConfig.apiUrl.length > 0, [initialConfig]);

	const saveData = useCallback(
		async (config: AiServerConfig) => {
			const url = apiUrlCreator.setAiData(workspacePath);
			await FetchService.fetch(url, JSON.stringify(config));
		},
		[workspacePath, apiUrlCreator],
	);

	const deleteData = useCallback(async () => {
		const url = apiUrlCreator.removeAiData(workspacePath);
		await FetchService.fetch(url);
		await refreshPage();
	}, [workspacePath, apiUrlCreator]);

	const fetchData = useCallback(async () => {
		const url = apiUrlCreator.getAiUrl(workspacePath);
		const res = await FetchService.fetch(url);
		if (!res.ok) return;

		const data = await res.json();

		setInitialConfig({ apiUrl: data, token: "" });
		setConfig({ apiUrl: data, token: "" });

		return { apiUrl: data, token: "" };
	}, [workspacePath, apiUrlCreator]);

	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	const checkToken = useCallback(
		async (apiUrl: string, token: string): Promise<boolean> => {
			return debounce<boolean>(
				async () => {
					const url = apiUrlCreator.checkAiAuth(apiUrl, token);
					const res = await FetchService.fetch(url);
					return await res.json();
				},
				500,
				tokenTimeout,
			);
		},
		[apiUrlCreator],
	);

	const checkServer = useCallback(
		async (apiUrl: string): Promise<boolean> => {
			return debounce<boolean>(
				async () => {
					const url = apiUrlCreator.checkAiServer(apiUrl);
					const res = await FetchService.fetch(url, undefined, undefined, undefined, false);
					return await res.json();
				},
				500,
				serverTimeout,
			);
		},
		[apiUrlCreator],
	);

	return {
		config,
		checkServer,
		saveData,
		initialConfig,
		isEdit,
		fetchData,
		deleteData,
		checkToken,
	};
};
