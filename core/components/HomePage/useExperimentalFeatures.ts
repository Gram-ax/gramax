import { getExecutingEnvironment } from "@app/resolveModule/env";
import { useCallback, useState } from "react";

const useExperimentalFeatures = () => {
	if (getExecutingEnvironment() === "next") return null;

	const [cooldown, setCooldown] = useState(false);

	const callback = useCallback(() => {
		if (typeof window === "undefined") return;

		if (cooldown) return;
		setCooldown(true);
		setTimeout(() => setCooldown(false), 500);

		window.debug.devMode.check() ? window.debug.devMode.disable() : window.debug.devMode.enable();

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(() => {
			getExecutingEnvironment() === "browser" ? window.location.reload() : void window.reloadAll();
		}, 500);
	}, [cooldown]);

	if (!window.debug?.devMode) return null;

	return {
		onClick: callback,
		checked: window.debug.devMode.check(),
	};
};

export default useExperimentalFeatures;
