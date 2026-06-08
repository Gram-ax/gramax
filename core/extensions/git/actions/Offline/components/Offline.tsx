import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import NetworkConnectionWatcher from "@ext/errorHandlers/network/NetworkConnectionWatcher";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const Offline = () => {
	const [reconnectInProgress, setReconnectInProgress] = useState(false);
	const offline = t("sync-offline");
	const tooltipText = offline;
	const iconCode = "wifi-off";

	const tryToReconnect = async () => {
		setReconnectInProgress(true);
		await NetworkConnectionWatcher.manualRetry();
		await new Promise((resolve) => setTimeout(resolve, 500));
		setReconnectInProgress(false);
	};

	return (
		<StatusBarElement
			className="sync-icons"
			iconClassName={reconnectInProgress ? "animate-wifi-pulse" : ""}
			iconCode={reconnectInProgress ? "wifi" : iconCode}
			iconStrokeWidth="1.6"
			onClick={tryToReconnect}
			tooltipText={tooltipText}
		/>
	);
};

export default Offline;
