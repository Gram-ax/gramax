import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ComponentProps } from "react";

const NetworkApiErrorComponent = ({ error: defaultError, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const error = defaultError as NetworkApiError;
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={error.title || t("app.error.something-went-wrong")}
			icon={{ code: "circle-x", color: "var(--color-danger)" }}
			isWarning={false}
		>
			<div className={"article"}>
				<p>
					<span dangerouslySetInnerHTML={{ __html: t("app.error.command-failed.body") }} />
				</p>
				<Note title={"Response"} collapsed={true} type={NoteType.hotfixes}>
					<CodeBlock value={JSON.stringify(error.props.errorJson, null, 2)} />
				</Note>
			</div>
		</InfoModalForm>
	);
};

export default NetworkApiErrorComponent;
