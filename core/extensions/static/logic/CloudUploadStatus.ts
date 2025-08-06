export type UploadStatus = {
	status: "building" | "uploading" | "error";
	progress?: { current: number; total: number };
	error?: string;
};

export class CloudUploadStatus {
	private static statuses: Map<string, UploadStatus> = new Map();

	static set(catalogName: string, status: UploadStatus) {
		this.statuses.set(catalogName, status);
	}

	static get(catalogName: string): UploadStatus | undefined {
		return this.statuses.get(catalogName);
	}

	static delete(catalogName: string) {
		this.statuses.delete(catalogName);
	}
}

export default CloudUploadStatus;
