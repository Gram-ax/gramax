import { invoke } from "@tauri-apps/api/primitives";

const str = (value: string | object) => (typeof value == "object" ? JSON.stringify(value, null, 2) : value.toString());

export const eq = (expect: any, given: any): void => {
	if (expect != given) throw new Error(`Ожидаемое ${str(expect)} не равно ${str(given)}`);
};

export const test = async (name: string, fn: () => Promise<void>) => {
	await fn()
		.then(() => console.info(`${name}: ok`))
		.catch((err) => {
			console.error(`${name}: fail`, err);
			void invoke("quit", {
				message: `Test:${global.currentTest ? " " + global.currentTest : ""} ${name}: fail\n${err}`,
				code: -1,
			});
		});
};

export const describe = async (name: string, runner: () => Promise<void>) => {
	console.group(name);
	global.currentTest = name;
	await runner().then(console.groupEnd);
	return `${name}: passed`;
};
