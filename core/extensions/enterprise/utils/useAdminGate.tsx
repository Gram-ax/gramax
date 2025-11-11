import { useEffect, useState } from "react";

type UseAdminGateOptions = {
	token?: string | null;
	enterpriseService: { isAdmin: (token: string) => Promise<boolean> };
	onErrorPolicy?: "forbid" | "error";
	enabled?: boolean;
};

export function useAdminGate({ token, enterpriseService, onErrorPolicy = "forbid", enabled }: UseAdminGateOptions) {
	const [loading, setLoading] = useState<boolean>(!!token);
	const [forbidden, setForbidden] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const isEnabled = enabled ?? !!token;

	useEffect(() => {
		let cancelled = false;

		async function check() {
			if (!isEnabled) {
				setLoading(false);
				setForbidden(false);
				setError(null);
				return;
			}
			if (!token) {
				setLoading(false);
				setForbidden(false);
				setError(null);
				return;
			}

			setLoading(true);
			setError(null);
			try {
				const ok = await enterpriseService.isAdmin(token);
				if (!cancelled) {
					setForbidden(!ok);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e);
					setForbidden(onErrorPolicy === "forbid");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		check();
		return () => {
			cancelled = true;
		};
	}, [isEnabled, token, enterpriseService, onErrorPolicy]);

	return { loading, forbidden, error };
}
