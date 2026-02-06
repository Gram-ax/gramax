import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ComponentProps } from "react";
import GetErrorComponent from "../../logic/GetErrorComponent";
import InfoModalForm from "./ErrorForm";

export const getIcon = (error: DefaultError) => {
	return error.isWarning
		? { code: error.icon || "alert-circle", color: "var(--color-admonition-note-br-h)" }
		: { code: error.icon || "circle-x", color: "var(--color-danger)" };
};

export const ErrorBody = ({ error }: { error: DefaultError }) => {
	return (
		<div className={"article"}>
			{error.props?.html ? (
				<span dangerouslySetInnerHTML={{ __html: error.message }} />
			) : (
				<span>{error.message}</span>
			)}
			{error.props?.showCause && error?.cause && (
				<Note collapsed={true} title={t("technical-details")} type={NoteType.hotfixes}>
					<CodeBlock value={error.cause.stack} />
				</Note>
			)}
		</div>
	);
};

const DefaultErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const isCommandError = error.title === t("app.error.command-failed.title");
	const onActionClick = () => {
		onCancelClick();
		window.location.reload();
	};

	return (
		<InfoModalForm
			actionButton={isCommandError ? { text: t("refresh"), onClick: onActionClick } : undefined}
			closeButton={error.title || error.isWarning ? { text: t("ok") } : null}
			icon={getIcon(error)}
			isWarning={error.isWarning}
			onCancelClick={onCancelClick}
			title={error.title ?? (error.isWarning ? t("warning") : t("error"))}
		>
			<ErrorBody error={error} />
		</InfoModalForm>
	);
};

export default DefaultErrorComponent;
