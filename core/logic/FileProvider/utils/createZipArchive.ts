import assert from "assert";
import type { default as JSZipType } from "jszip";
import FileProvider from "../../FileProvider/model/FileProvider";
import Path from "../../FileProvider/Path/Path";

export async function createZipArchive(fp: FileProvider, directoryPath: Path): Promise<Uint8Array> {
	const JSZip = await import("jszip");
	const zip = new JSZip.default();

	assert(await fp.exists(directoryPath), `directory not found: ${directoryPath.value}`);
	assert(await fp.isFolder(directoryPath), `path is not a directory: ${directoryPath.value}`);

	await addDirectoryToZip(zip, fp, directoryPath, "");

	return await zip.generateAsync({
		type: "uint8array",
		compression: "DEFLATE",
		compressionOptions: {
			level: 6,
		},
	});
}

async function addDirectoryToZip(
	zip: JSZipType,
	fo: FileProvider,
	currentPath: Path,
	archivePath: string,
): Promise<void> {
	const items = await fo.getItems(currentPath);

	for (const item of items) {
		const itemArchivePath = archivePath ? `${archivePath}/${item.name}` : item.name;

		if (item.isDirectory()) {
			zip.folder(itemArchivePath);
			await addDirectoryToZip(zip, fo, item.path, itemArchivePath);
		} else {
			const content = await fo.readAsBinary(item.path);
			zip.file(itemArchivePath, new Uint8Array(content));
		}
	}
}

export async function downloadZipArchive(
	fileProvider: FileProvider,
	directoryPath: Path,
	archiveName: string,
): Promise<void> {
	try {
		const zipData = await createZipArchive(fileProvider, directoryPath);
		const blob = new Blob([zipData], { type: "application/zip" });

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${archiveName}.zip`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Failed to create and download ZIP archive:", error);
		throw error;
	}
}
