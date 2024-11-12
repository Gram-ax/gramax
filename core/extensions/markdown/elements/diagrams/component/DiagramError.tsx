import AlertError from "@components/AlertError";
import t from "@ext/localization/locale/translate";

interface DiagramErrorProps {
	error: Omit<Error, "name">;
	title?: string;
	diagramName?: string;
}

const DiagramError = ({ error, title, diagramName }: DiagramErrorProps) => {
	const alertTitle = `${title || t("diagram.error.render-failed")}${diagramName ? ` (${diagramName})` : ""}`;
	error.stack = error.cause ? (error.cause as string) : error.stack;
	return <AlertError title={alertTitle} error={error} />;
};

export default DiagramError;
