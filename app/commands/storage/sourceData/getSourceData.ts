import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { Command } from "../../../types/Command";

const getSourceData: Command<{ ctx: Context }, SourceData[]> = Command.create({
	path: "storage/sourceData/getSourceData",

	kind: ResponseKind.json,

	do({ ctx }) {
		const { wm } = this._app;
		if (!wm) return [];
		return this._app.rp.getSourceDatas(ctx) ?? [];
	},

	params(ctx) {
		return { ctx };
	},
});

export default getSourceData;
