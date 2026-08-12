import { ResponseKind } from "@app/types/ResponseKind";
import type { PageProps } from "@components/Pages/models/Pages";
import type { PageDataParams } from "@core/SitePresenter/types/PageDataParams";
import resolvePageData from "@ext/article/utils/resolvePageData";
import { Command } from "../../types/Command";

const getPageData: Command<PageDataParams, PageProps> = Command.create({
	path: "page/getPageData",

	kind: ResponseKind.json,

	flags: ["otel-omit-result"],

	async do(props: PageDataParams) {
		return await resolvePageData(this._commands, this._app.wm, props);
	},

	params(ctx, q) {
		const path = q.path;
		const mode = q.mode;
		const diff = q.diff;
		return { ctx, path, mode, diff };
	},
});

export default getPageData;
