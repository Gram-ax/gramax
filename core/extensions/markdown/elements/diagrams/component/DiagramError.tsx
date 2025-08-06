import AlertError from "@components/AlertError";
import t from "@ext/localization/locale/translate";

interface DiagramErrorProps {
	error: Omit<Error, "name">;
	title?: string;
	diagramName?: string;
}

const DiagramError = ({ error, title, diagramName }: DiagramErrorProps) => {
	const alertTitle = `${title || t("diagram.error.render-failed")}${diagramName ? ` (${diagramName})` : ""}`;
	if (error.cause) {
		if (typeof error.cause === "string") {
			error.stack = error.cause;
		} else if (typeof error.cause === "object" && "cause" in error.cause && typeof error.cause.cause === "string") {
			error.stack = error.cause.cause;
		}
	}
	return <AlertError title={alertTitle} error={error} />;
};

export default DiagramError;
