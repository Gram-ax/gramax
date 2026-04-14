import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";

export const headers = {
	base: { "Access-Control-Allow-Origin": "*" },
	html: { "Content-Type": "text/html; charset=utf-8" },
	json: { "Content-Type": "application/json; charset=utf-8" },
	length: (content: string | Buffer) => ({ "Content-Length": `${Buffer.byteLength(content, "utf8")}` }),
	contentType: (mime: MimeTypes) => ({ "Content-Type": mime }),
	contentDisposition: (filename: string, mime: MimeTypes) => {
		if (mime !== MimeTypes.xml && mime !== MimeTypes.xls && mime !== MimeTypes.xlsx) return {};
		return { "Content-Disposition": `attachment; filename=${encodeURIComponent(filename)}` };
	},
};
