import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import StorageData from "@ext/storage/models/StorageData";
import YandexDiskServiceAPI from "@ext/yandexDisk/api/YandexDiskServiceAPI";
import YandexDiskImportData from "@ext/yandexDisk/model/YandexDiskImportData";

export default class YandexDiskStorage {
	constructor(private _data: StorageData, private _fileProvider: FileProvider, private _basePath: Path) {}

	static async clone({ fs, data, catalogPath }: YandexDiskImportData) {
		fs.fp.stopWatch();
		try {
			const storage = new YandexDiskStorage(data, fs.fp, catalogPath);
			await storage._processFolder("app:/");
		} finally {
			fs.fp.startWatch();
		}
	}

	private async _processFolder(folderPath: string): Promise<void> {
		const api = makeSourceApi(this._data.source) as YandexDiskServiceAPI;
		const folderData = await api.getFolderContents(folderPath);

		const files = folderData._embedded.items.filter((item) => item.mime_type === "text/plain");

		const tasks = files.map((file) => () => {
			const destinationPath = Path.join(this._basePath.toString(), this._cleanPath(file.path));
			return this._downloadFile(file.path, new Path(destinationPath));
		});

		const subfolders = folderData._embedded.items.filter((item) => item.type === "dir");
		tasks.push(...subfolders.map((folder) => () => this._processFolder(folder.path)));

		await Promise.all(tasks.map((task) => task()));
	}

	private async _downloadFile(filePath: string, destination: Path): Promise<void> {
		const api = makeSourceApi(this._data.source) as YandexDiskServiceAPI;
		const downloadLink = await api.getFileDownloadLink(filePath);

		const response = await fetch(downloadLink);
		if (!response.ok) {
			throw new DefaultError(
				`Failed to download file: ${filePath}. Status: ${response.status} ${response.statusText}`,
			);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		await this._fileProvider.write(destination, buffer);
	}

	private _cleanPath(path: string): string {
		const segments = path.split("/");
		return segments.slice(3).join("/");
	}
}
