import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import type NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import { FormHeader } from "@ui-kit/Form";
import type { ComponentProps } from "react";

const NetworkApiErrorComponent = ({ error: defaultError, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const error = defaultError as NetworkApiError;
	return (
		<>
			<FormHeader
				icon="circle-x"
				iconColor="var(--color-danger)"
				title={error.title || t("app.error.something-went-wrong")}
			/>
			<DialogBody>
				<div className={"article"}>
					<p>
						{/** biome-ignore lint/style/useNamingConvention: expected */}
						<span dangerouslySetInnerHTML={{ __html: t("app.error.command-failed.body") }} />
					</p>
					<Note collapsed={true} title={"Response"} type={NoteType.hotfixes}>
						<CodeBlock>{JSON.stringify(error.props.errorJson, null, 2)}</CodeBlock>
					</Note>
				</div>
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onCancelClick }} />
		</>
	);
};

export default NetworkApiErrorComponent;
