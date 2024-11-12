import type { ContentLanguage } from "@ext/localization/core/model/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import type { Context } from "vm";
import { Command } from "../../types/Command";

const setLanguage: Command<{ ctx: Context; language: ContentLanguage }, void> = Command.create({
	path: "language/set",

	do({ ctx, language }) {
		ctx.cookie.set("ui", language);
	},

	params(ctx, query) {
		return { ctx, language: UiLanguage[query.language] };
	},
});

export default setLanguage;
