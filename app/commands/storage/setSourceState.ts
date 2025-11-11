import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const setSourceInvalidState: Command<{ ctx: Context; storageName: string; isValid: boolean }, void> = Command.create({
	path: "storage/setSourceState",

	do({ ctx, storageName, isValid }) {
		const source = this._app.rp.getSourceData(ctx, storageName);
		if (!source) return;
		source.isInvalid = !isValid;
		this._app.rp.setSourceData(ctx, source);
	},

	params(ctx, q) {
		return { ctx, storageName: q.storageName, isValid: q.isValid == "true" };
	},
});

export default setSourceInvalidState;
