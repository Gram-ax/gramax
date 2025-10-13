import { env } from "@app/resolveModule/env";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "@ui-kit/Toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateCheck, updateInstall } from "../window/commands";

const LAST_UPDATE_CHECK_KEY = "last-update-check";
const SHORT_UPDATE_CHECK_INTERVAL = 1000 * 60 * 15; // 15 minutes, useful when user opens a new window

export type UpdateIncoming = {
	version: string;
	pubDate: string;
};

export type UpdateDownloadProgress = {
	bytes: number;
	chunk: number;
	total: number | null;
	bytesPerSec: number;
	etaSec: number | null;
};

export enum UpdateStatus {
	None,
	Incoming,
	Downloading,
	Ready,
	Error,
}

export type UpdateState =
	| { state: UpdateStatus.None; info: Record<string, never> }
	| { state: UpdateStatus.Incoming; info: UpdateIncoming }
	| { state: UpdateStatus.Downloading; info: UpdateDownloadProgress }
	| { state: UpdateStatus.Ready; info: Record<string, never> }
	| { state: UpdateStatus.Error; info: { error: string } };

export enum UpdateAcceptance {
	None,
	Accepted,
	Declined,
}

const broadcast = new BroadcastChannel("update-events");

const useUpdateChecker = () => {
	const [state, setState] = useState<UpdateState>({ state: UpdateStatus.None, info: {} as Record<string, never> });
	const [acceptance, setAcceptance] = useState<UpdateAcceptance>(UpdateAcceptance.None);

	const ref = useRef(state);

	const resetUpdate = useCallback((noemit?: boolean) => {
		if (!noemit) broadcast.postMessage({ type: "update:reset" });
		setState({ state: UpdateStatus.None, info: {} });
		setAcceptance(UpdateAcceptance.None);
	}, []);

	useEffect(() => {
		const current = getCurrentWebviewWindow();

		current.listen("update:incoming", (ev) => {
			setState(() => {
				setAcceptance(UpdateAcceptance.None);
				ref.current = { state: UpdateStatus.Incoming, info: ev.payload as UpdateIncoming };
				return ref.current;
			});
		});

		current.listen("update:downloading", (ev) => {
			setState(() => {
				ref.current = { state: UpdateStatus.Downloading, info: ev.payload as UpdateDownloadProgress };
				return ref.current;
			});
		});

		current.listen("update:ready", () => {
			setState(() => {
				ref.current = { state: UpdateStatus.Ready, info: {} };
				return ref.current;
			});
		});

		current.listen("update:error", (ev) => {
			setState(() => {
				ref.current = { state: UpdateStatus.Error, info: { error: ev.payload as string } };
				return ref.current;
			});
		});

		broadcast.addEventListener("message", (ev) => {
			if (ev.data.type === "update:reset") resetUpdate(true);
			if (ev.data.type === "update:set-accept") {
				const payload = ev.data.payload as UpdateAcceptance;
				if (payload === UpdateAcceptance.Accepted) accept(true);
				if (payload === UpdateAcceptance.Declined) decline(true);
			}
		});

		const lastCheck = Date.now() - Number(window.sessionStorage.getItem(LAST_UPDATE_CHECK_KEY) ?? 0);
		if (lastCheck > SHORT_UPDATE_CHECK_INTERVAL && window.navigator.onLine) {
			void updateCheck(false);
			window.sessionStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
		}

		const maybeInstalled = env("UPDATE_INSTALLED");
		if (maybeInstalled) {
			setTimeout(() => {
				toast(t("app.update.installed"), {
					focus: "medium",
					status: "success",
					icon: "check-circle",
					closeAction: false,
					size: "sm",
					duration: 2500,
				});
			}, 800);
		}
	}, []);

	const install = useCallback(async () => {
		await updateInstall();
		resetUpdate();
	}, [resetUpdate]);

	const decline = useCallback(
		(noemit?: boolean) => {
			if (!noemit) broadcast.postMessage({ type: "update:set-accept", payload: UpdateAcceptance.Declined });
			if (ref.current.state === UpdateStatus.Ready) return resetUpdate();
			setAcceptance(() => UpdateAcceptance.Declined);
		},
		[resetUpdate],
	);

	const accept = useCallback(
		async (noemit?: boolean) => {
			if (!noemit) broadcast.postMessage({ type: "update:set-accept", payload: UpdateAcceptance.Accepted });
			if (ref.current.state === UpdateStatus.Ready) return install();
			setAcceptance(UpdateAcceptance.Accepted);
		},
		[install],
	);

	useWatch(() => {
		if (ref.current.state !== UpdateStatus.Ready) return;

		if (acceptance === UpdateAcceptance.Accepted) install();
		if (acceptance === UpdateAcceptance.Declined) resetUpdate();
	}, [acceptance, state, install, resetUpdate]);

	return { state, resetUpdate, acceptance, install, accept, decline };
};

export default useUpdateChecker;
