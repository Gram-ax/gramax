import { getExecutingEnvironment } from "@app/resolveModule/env";

export const registerOtel = async (): Promise<void> => {
	if (getExecutingEnvironment() === "next" || getExecutingEnvironment() === "cli") {
		await (await import("./next/registerOtel")).registerOtel();
	} else {
		await (await import("./web/registerOtel")).registerOtel();
	}
};
