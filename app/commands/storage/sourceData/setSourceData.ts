import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { Command } from "../../../types/Command";

const setSourceData: Command<{ ctx: Context } & SourceData, string> = Command.create({
	path: "storage/sourceData/setSourceData",

	kind: ResponseKind.plain,

	async do({ ctx, ...data }) {
		const { wm } = this._app;
		await wm.currentOrDefault(); // to be sure that the workspace is initialized

		return this._app.rp.setSourceData(ctx, data);
	},

	params(ctx, _, body) {
		return { ctx, ...body };
	},
});

export default setSourceData;
