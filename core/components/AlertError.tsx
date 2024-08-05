import t from "@ext/localization/locale/translate";
import Alert, { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

import { ReactElement } from "react";

interface AlertErrorProps {
	title?: string;
	error: { message: string; stack?: string };
}

const AlertError = ({ title, error }: AlertErrorProps): ReactElement => {
	return (
		<Alert title={title ?? t("app.error.something-went-wrong")} type={AlertType.error}>
			<>
				<div>{error.message}</div>
				{error.stack && (
					<Note title={t("alert.details")} collapsed={true} type={NoteType.danger}>
						<Fence value={error.stack} />
					</Note>
				)}
			</>
		</Alert>
	);
};

export default AlertError;
