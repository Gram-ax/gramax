import t from "@ext/localization/locale/translate";
import Alert, { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

import { ReactElement } from "react";

interface AlertErrorProps {
	title?: string;
	error: { message: string; stack?: string };
	isHtmlMessage?: boolean;
}

const AlertError = ({ title, error, isHtmlMessage }: AlertErrorProps): ReactElement => {
	return (
		<Alert title={title ?? t("app.error.something-went-wrong")} type={AlertType.error}>
			{isHtmlMessage ? <div dangerouslySetInnerHTML={{ __html: error.message }} /> : <div>{error.message}</div>}
			{error.stack && (
				<Note title={t("alert.details")} disableRender={true} collapsed={true} type={NoteType.danger}>
					<CodeBlock value={error.stack} />
				</Note>
			)}
		</Alert>
	);
};

export default AlertError;
