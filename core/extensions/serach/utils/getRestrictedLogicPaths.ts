import type Context from "@core/Context/Context";
import RuleProvider from "@ext/rules/RuleProvider";
import type { Workspace } from "@ext/workspace/Workspace";

export const getRestrictedLogicPaths = async (
	wm: Workspace,
	catalogNames: string[],
	ctx: Context,
): Promise<string[]> => {
	if (catalogNames.length === 0) return [];

	const itemFilters = new RuleProvider(ctx).getItemFilters();
	return (
		await catalogNames.mapAsync(async (catalogName) => {
			const catalog = await wm.getContextlessCatalog(catalogName);
			if (!catalog) return [];
			const all = catalog.getItems().map((a) => a.logicPath);
			const accessible = new Set(catalog.getItems(itemFilters).map((a) => a.logicPath));
			return all.filter((p) => !accessible.has(p));
		})
	).flat();
};
