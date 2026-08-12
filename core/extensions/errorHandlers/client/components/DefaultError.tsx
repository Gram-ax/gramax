import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { ComponentProps } from "react";
import type GetErrorComponent from "../../logic/GetErrorComponent";

export const getIcon = (error: Pick<DefaultError, "icon" | "isWarning">) => {
	return error.isWarning
		? { code: error.icon || "alert-circle", color: "var(--color-admonition-note-br-h)" }
		: { code: error.icon || "circle-x", color: "var(--color-danger)" };
};

export const ErrorBody = ({ error }: { error: DefaultError }) => {
	return (
		<div className={"article"} style={{ background: "transparent" }}>
			{error.props?.html ? (
				// biome-ignore lint/style/useNamingConvention: it's a html message
				<span dangerouslySetInnerHTML={{ __html: error.message }} />
			) : (
				<span>{error.message}</span>
			)}
			{error.props?.showCause && error?.cause?.stack && error?.cause?.stack !== "null" && (
				<Note collapsed={true} title={t("technical-details")} type={NoteType.hotfixes}>
					<CodeBlock>{error.cause.stack}</CodeBlock>
				</Note>
			)}
		</div>
	);
};

const DefaultErrorComponent = ({ appVersionLabel, error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const isCommandError = error.title === t("app.error.command-failed.title");
	const onActionClick = () => {
		onCancelClick();
		window.location.reload();
	};

	return (
		<>
			<DialogErrorHeader error={error} />
			<DialogBody>
				<ErrorBody error={error} />
				{appVersionLabel && <span className="text-muted mr-auto mt-2 block text-xs">{appVersionLabel}</span>}
			</DialogBody>
			<DialogFooterTemplate
				primaryButton={isCommandError ? t("refresh") : t("ok")}
				primaryButtonProps={{
					onClick: isCommandError ? onActionClick : onCancelClick,
				}}
				secondaryButton={isCommandError ? t("cancel") : undefined}
				secondaryButtonProps={
					isCommandError
						? {
								onClick: onCancelClick,
								variant: "outline" as const,
							}
						: undefined
				}
			/>
		</>
	);
};

export default DefaultErrorComponent;
