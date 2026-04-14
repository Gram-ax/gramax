import AlertError from "@components/AlertError";
import styled from "@emotion/styled";
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

const AlertContainer = styled.div`
    width: min(var(--article-max-width), 95dvw);
    justify-self: center;
`;

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
		<AlertContainer>
			<AlertError error={error} title={alertTitle} />
		</AlertContainer>
	);
};

export default FilePreviewError;
