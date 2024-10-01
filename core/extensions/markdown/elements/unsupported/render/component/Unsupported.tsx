import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";
import Alert, { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

import { ReactElement } from "react";

interface UnsupportedProps {
	url?: string;
	code?: string;
}

const Unsupported = ({ url, code }: UnsupportedProps): ReactElement => {
	return (
		<Alert
			className={"focus-pointer-events"}
			title={t("confluence.error.cannot-import.title")}
			type={AlertType.warning}
		>
			<span>
				{`${t("confluence.error.cannot-import.desc")} `}
				<Anchor href={url}>{url}</Anchor>
			</span>
			<Note title={t("alert.details")} type={NoteType.note} collapsed>
				<CodeBlock value={code} lang={"json"} />
			</Note>
		</Alert>
	);
};

export default Unsupported;
