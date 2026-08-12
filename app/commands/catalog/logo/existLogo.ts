import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import {
	getLogoEmoji,
	getLogoIconCode,
	getLogoIconColor,
	isLogoEmoji,
	isLogoIcon,
} from "@ext/catalog/logo/catalogLogoIcon";
import Theme from "@ext/Theme/Theme";

const existLogo: Command<
	{ catalogName: string; theme: Theme },
	{ isExist?: boolean; iconCode?: string; iconColor?: string; emoji?: string }
> = Command.create({
	path: "catalog/logo/exist",

	kind: ResponseKind.json,

	async do({ catalogName, theme }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getBaseCatalog(catalogName);
		if (!catalog) return {};

		const logoPath = Theme[theme] === Theme.light ? catalog.props.logo : catalog.props[`logo_${theme}`];
		if (!logoPath) return { isExist: false };

		if (isLogoIcon(logoPath)) {
			return { isExist: true, iconCode: getLogoIconCode(logoPath), iconColor: getLogoIconColor(logoPath) };
		}

		if (isLogoEmoji(logoPath)) {
			return { isExist: true, emoji: getLogoEmoji(logoPath) };
		}

		const pathToLogo = catalog.getRootCategoryDirectoryPath().join(new Path(logoPath));
		const isExist = await workspace.getFileProvider().exists(pathToLogo);
		return { isExist };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const theme = q.theme as Theme;
		return { ctx, catalogName, theme };
	},
});

export default existLogo;
