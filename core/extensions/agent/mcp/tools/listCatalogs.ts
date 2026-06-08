import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

export async function runListCatalogs({ app }: ToolExecutionContext): Promise<ToolExecutionResult> {
	try {
		const wm = app.wm.current();
		const map = wm.getAllCatalogs();
		const catalogs = [...map.keys()].sort().map((name) => {
			const entry = map.get(name);
			return { name, title: entry?.props?.title ?? name };
		});
		return ok({ catalogs });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Catalog list error: ${msg}`);
	}
}
