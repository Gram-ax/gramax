import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { AiServerConfig } from "@ext/ai/models/types";
import { MutableRefObject, useCallback, useRef } from "react";

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
	const serverTimeout = useRef<NodeJS.Timeout>();
	const tokenTimeout = useRef<NodeJS.Timeout>();

	const saveData = useCallback(
		async (config: AiServerConfig) => {
			const url = apiUrlCreator.setAiData(workspacePath);
			await FetchService.fetch(url, JSON.stringify(config));
		},
		[workspacePath, apiUrlCreator],
	);

	const getData = useCallback(async () => {
		const url = apiUrlCreator.getAiData(workspacePath);
		const res = await FetchService.fetch(url);
		if (!res.ok) return;
		const data = await res.json();

		return { aiApiUrl: data.apiUrl, aiToken: data.token };
	}, [workspacePath, apiUrlCreator]);

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
		checkServer,
		saveData,
		getData,
		checkToken,
	};
};
