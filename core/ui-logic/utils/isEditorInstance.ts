import { getExecutingEnvironment } from "@app/resolveModule/env";

export const isEditorInstance = () => {
	const environment = getExecutingEnvironment();
	return environment === "tauri" || environment === "browser";
};
