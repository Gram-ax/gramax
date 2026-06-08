import NetworkConnectionWatcher from "@ext/errorHandlers/network/NetworkConnectionWatcher";
import { useEffect, useState } from "react";

const useIsOffline = (): boolean => {
	const [isOffline, setIsOffline] = useState(() => NetworkConnectionWatcher.getIsOffline());

	useEffect(() => {
		const watcher = NetworkConnectionWatcher;

		const offlineToken = watcher.getEvents().on("offline", () => setIsOffline(true));
		const onlineToken = watcher.getEvents().on("online", () => setIsOffline(false));

		return () => {
			watcher.getEvents().off(offlineToken);
			watcher.getEvents().off(onlineToken);
		};
	}, []);

	return isOffline;
};

export default useIsOffline;
