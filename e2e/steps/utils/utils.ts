import E2EWorld, { ReplaceAlias } from "../../models/World";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const replaceMultiple = (text: string, alias: ReplaceAlias, sep = "/") =>
	text
		.split(sep)
		.map((p) => alias(p, () => p))
		.join(sep);

export const makePath = (path: string): any => ({ type: "path", val: path });

export const checkForErrorModal = async (world: E2EWorld) => {
	try {
		return (
			(await world
				.page()
				.inner()
				.locator(`[data-qa="qa-error-info-modal"], #__next .error > span:nth-child(1)`)
				.count()) > 0
		);
	} catch (e) {
		console.warn(e);
		return false;
	}
};
