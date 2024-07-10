import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ComponentProps } from "react";
import useLocalize from "../../../localization/useLocalize";
import GetErrorComponent from "../../logic/GetErrorComponent";
import InfoModalForm from "./ErrorForm";

const DefaultErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={error.title ?? (error.isWarning ? useLocalize("warning") : useLocalize("error"))}
			icon={
				error.isWarning
					? { code: "alert-circle", color: "var(--color-admonition-note-br-h)" }
					: { code: "circle-x", color: "var(--color-danger)" }
			}
			closeButton={error.title || error.isWarning ? { text: useLocalize("ok") } : null}
			isWarning={error.isWarning}
		>
			<div className={error.props?.html ? "article" : ""}>
				{error.props?.html ? (
					<span dangerouslySetInnerHTML={{ __html: error.message }} />
				) : (
					<span>{error.message}</span>
				)}
				{error.props?.showCause && error?.cause && (
					<Note title={useLocalize("technicalDetails")} collapsed={true} type={NoteType.hotfixes}>
						<Fence value={error.cause.stack} />
					</Note>
				)}
			</div>
		</InfoModalForm>
	);
};

export default DefaultErrorComponent;
