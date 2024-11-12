import fileNameUtils from "@core-ui/fileNameUtils";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import getImageFromBlob from "@ext/markdown/elements/copyMsO/getImageFromBlob";

const createImage = async (
	article: Article,
	fp: FileProvider,
	articlePath: Path,
	resourcePath: Path,
	resourceName: string,
) => {
	const fullResourcePath = new Path([resourcePath.value, resourceName]);
	const isBlob = resourcePath.value.startsWith("blob:");
	const fs = new DiskFileProvider(resourcePath);
	const data = isBlob
		? await getImageFromBlob(resourcePath.value).then((arrayBuffer: Buffer) => arrayBuffer)
		: await fs.readAsBinary(new Path(resourceName));

	if (!data) return;
	const items = await fp.getItems(articlePath.parentDirectoryPath);

	const baseFileName = fullResourcePath.name;
	const extension = fullResourcePath.extension;

	const names = items.map((i) => "./" + i.name);
	const newName = new Path(fileNameUtils.getNewName(names, isBlob ? article.getFileName() : baseFileName, extension));

	return { newName, data };
};

export default createImage;
