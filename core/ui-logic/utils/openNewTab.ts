import { getExecutingEnvironment } from "@app/resolveModule/env";

const openNewTab = (url: string) => {
	if (getExecutingEnvironment() == "tauri") window.location.replace(url);
	else window.open(url);
};

export default openNewTab;
