import ConfluenceAttachment from "@ext/confluence/actions/Import/model/ConfluenceAttachment";

const confluenceMimeToExtension = (attachment: ConfluenceAttachment): string | null => {
	const mimeTypes: { [key: string]: string } = {
		"text/plain": "txt",
		"text/html": "html",
		"text/css": "css",
		"text/javascript": "js",
		"application/json": "json",
		"application/xml": "xml",
		"application/pdf": "pdf",
		"application/zip": "zip",
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"audio/mpeg": "mp3",
		"audio/wav": "wav",
		"application/vnd.ms-excel": "xls",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
		"application/vnd.ms-powerpoint": "ppt",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
		"application/msword": "doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
		"binary/octet-stream": attachment.title.split(".").pop(),
		"application/octet-stream": attachment.title.split(".").pop(),
	};

	return mimeTypes[attachment.mediaType] ?? null;
};

export default confluenceMimeToExtension;
