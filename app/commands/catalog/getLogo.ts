import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Path from "@core/FileProvider/Path/Path";
import HashItemRef from "@core/Hash/HashItems/HashItemRef";
import Theme from "@ext/Theme/Theme";
import { Command, ResponseKind } from "../../types/Command";

const getLogo: Command<{ catalogName: string; themeName: string }, { hashItem: HashItemRef; mime: string }> =
	Command.create({
		path: "catalog/logo",

		kind: ResponseKind.blob,

		do({ catalogName, themeName: theme }) {
			const { lib } = this._app;
			const catalog = lib.getCatalogEntry(catalogName);
			if (!catalog) return;
			const logo =
				theme == Theme.light ? catalog.props["logo"] : catalog.props["logo_" + theme] ?? catalog.props["logo"];
			if (!logo) return;

			const ref = { ...catalog.ref };
			ref.path = catalog.ref.path.join(new Path(logo));
			const hashItem: HashItemRef = new HashItemRef(ref, lib);

			return { hashItem, mime: MimeTypes[ref.path.extension] ?? ref.path.extension };
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const themeName = q.theme;
			return { ctx, catalogName, themeName };
		},
	});

export default getLogo;
