import DefaultError from "@ext/errorHandlers/logic/DefaultError";

export class FileError extends DefaultError {
	public fileName: string;
	constructor(message: string, fileName: string, cause?: Error) {
		super(message, cause);
		this.name = "FileError";
		this.fileName = fileName;
	}
}

export class FilePreviewError extends FileError {
	constructor(message: string, fileName: string, cause?: Error) {
		super(message, fileName, cause);
		this.name = "FilePreviewError";
	}
}
