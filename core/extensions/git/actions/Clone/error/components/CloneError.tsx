import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { GetErrorComponentProps } from "../../../../../errorHandlers/logic/GetErrorComponent";

const CloneErrorComponent = ({ error, onCancelClick }: GetErrorComponentProps) => {
	const cause = (error.cause?.cause || error.cause) as Error;

	return (
		<>
			<DialogErrorHeader error={error} title={t("clone-fail")} />
			<DialogBody>
				<div className="article !bg-transparent">
					<div>
						{t("clone-error-desc1")}
						{error.props.remoteUrl && (
							<>
								{" "}
								<a href={error.props.remoteUrl} rel="noreferrer" target="_blank">
									{error.props.remoteUrl}
								</a>
							</>
						)}
						. {t("clone-error-desc2")}
					</div>

					{cause && (
						<Note collapsed={true} title={t("technical-details")} type={NoteType.hotfixes}>
							<CodeBlock>
								{cause.stack.includes("Fn:")
									? cause.stack
									: `${cause.name}: ${cause.message}\n${cause.stack}`}
							</CodeBlock>
						</Note>
					)}
				</div>
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onCancelClick }} />
		</>
	);
};

export default CloneErrorComponent;
