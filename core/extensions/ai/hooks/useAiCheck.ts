import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { type MutableRefObject, useCallback, useRef, useState } from "react";

type Pending<T> = { timeout: NodeJS.Timeout; resolve: (value: T) => void };

const debounce = <T>(
	callback: () => Promise<T>,
	timeout: number,
	pendingRef: MutableRefObject<Pending<T> | null>,
	fallback: T,
): Promise<T> => {
	return new Promise((resolve) => {
		// Resolve the previous Promise so zodResolver doesn't sit in isValidating forever.
		if (pendingRef.current) {
			clearTimeout(pendingRef.current.timeout);
			pendingRef.current.resolve(fallback);
		}
		const handle: Pending<T> = {
			resolve,
			timeout: setTimeout(() => {
				void (async () => {
					try {
						resolve(await callback());
					} catch {
						resolve(fallback);
					} finally {
						if (pendingRef.current === handle) pendingRef.current = null;
					}
				})();
			}, timeout),
		};
		pendingRef.current = handle;
	});
};

/**
 * Debounced AI endpoint/token validation, shared by the workspace AI form and
 * the app-settings AI section (extracted from useWorkspaceAi). Used as an async
 * zod refinement: while the user types, each keystroke re-triggers validation,
 * so the previous pending check must resolve (see debounce above) or the form
 * would hang in isValidating.
 */
export const useAiCheck = () => {
	const serverPending = useRef<Pending<boolean> | null>(null);
	const tokenPending = useRef<Pending<boolean> | null>(null);
	const [isChecking, setIsChecking] = useState(false);
	const apiUrlCreator = ApiUrlCreator.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	apiUrlCreatorRef.current = apiUrlCreator;

	const checkServer = useCallback(async (apiUrl: string): Promise<boolean> => {
		setIsChecking(true);
		return debounce<boolean>(
			async () => {
				try {
					const url = apiUrlCreatorRef.current.checkAiServer(apiUrl);
					const res = await FetchService.fetch(url, undefined, undefined, undefined, false);
					return await res.json();
				} finally {
					setIsChecking(false);
				}
			},
			500,
			serverPending,
			false,
		);
	}, []);

	const checkToken = useCallback(async (apiUrl: string, token: string): Promise<boolean> => {
		setIsChecking(true);
		return debounce<boolean>(
			async () => {
				try {
					const url = apiUrlCreatorRef.current.checkAiAuth(apiUrl);
					const res = await FetchService.fetch(url, JSON.stringify({ token }));
					return await res.json();
				} finally {
					setIsChecking(false);
				}
			},
			500,
			tokenPending,
			false,
		);
	}, []);

	return { checkServer, checkToken, isChecking };
};
