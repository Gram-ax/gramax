import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const enableCloud: Command<void, void> = Command.create({
	path: "enterpriseCloud/enableCloud",

	kind: ResponseKind.none,

	async do() {
		const { enterpriseCloudManager } = this._app;
		await enterpriseCloudManager.enable();
	},
});

export default enableCloud;
