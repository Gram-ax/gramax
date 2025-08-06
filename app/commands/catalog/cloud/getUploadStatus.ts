import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import CloudUploadStatus, { UploadStatus } from "@ext/static/logic/CloudUploadStatus";

const getUploadStatus: Command<{ catalogName: string }, UploadStatus> = Command.create({
	path: "catalog/cloud/getUploadStatus",
	kind: ResponseKind.json,

	do({ catalogName }) {
		const status = CloudUploadStatus.get(catalogName);
		return status;
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getUploadStatus;
