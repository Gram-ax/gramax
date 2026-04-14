import AlertError from "@components/AlertError";
import { ResourceEmptyError, ResourceNotFoundError } from "@core-ui/ContextServices/ResourceService/errors";
import t from "@ext/localization/locale/translate";

interface DiagramErrorProps {
	error: Omit<Error, "name"> | boolean;
	title?: string;
	diagramName?: string;
}

const getErrorMessage = (error: Omit<Error, "name">) => {
	if (error instanceof ResourceEmptyError) return t("diagram.error.content-empty");
	if (error instanceof ResourceNotFoundError) return t("diagram.error.cannot-get-data");
};

const DiagramError = ({ error, title, diagramName }: DiagramErrorProps) => {
	const alertTitle = `${title || t("diagram.error.render-failed")}${diagramName ? ` (${diagramName})` : ""}`;

	if (typeof error === "boolean") {
		return <AlertError error={{ message: t("app.error.something-went-wrong") }} title={alertTitle} />;
	}

	if (error.cause) {
		if (typeof error.cause === "string") {
			error.stack = error.cause;
		} else if (typeof error.cause === "object" && "cause" in error.cause && typeof error.cause.cause === "string") {
			error.stack = error.cause.cause;
		}
	}

	const errorMessage = getErrorMessage(error);
	error.message = errorMessage ?? error.message;
	return <AlertError error={error} title={alertTitle} />;
};

export default DiagramError;
