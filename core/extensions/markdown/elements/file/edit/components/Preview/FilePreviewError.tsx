import AlertError from "@components/AlertError";
import t from "@ext/localization/locale/translate";
import {
	type FileError,
	FilePreviewError as FilePreviewErrorModel,
} from "@ext/markdown/elements/file/edit/model/fileErrors";

interface FilePreviewErrorProps {
	error: FileError;
}

const getErrorMessage = (error: FileError) => {
	if (error instanceof FilePreviewErrorModel)
		return t("file-preview.preview-error").replace("{fileName}", error.fileName);
	return error.message;
};

const FilePreviewError = ({ error }: FilePreviewErrorProps) => {
	const alertTitle = t("file-preview.render-error");

	if (error.cause) {
		if (typeof error.cause === "string") {
			error.stack = error.cause;
		} else if (typeof error.cause === "object" && "cause" in error.cause && typeof error.cause.cause === "string") {
			error.stack = error.cause.cause;
		}
	}

	const errorMessage = getErrorMessage(error);
	error.message = errorMessage ?? error.message;
	return (
		<div className="w-full max-w-5xl justify-self-center">
			<AlertError error={error} title={alertTitle} />
		</div>
	);
};

export default FilePreviewError;
