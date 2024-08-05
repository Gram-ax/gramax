import t from "@ext/localization/locale/translate";
import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ComponentProps } from "react";
import GetErrorComponent from "../../logic/GetErrorComponent";
import InfoModalForm from "./ErrorForm";

const DefaultErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={error.title ?? (error.isWarning ? t("warning") : t("error"))}
			icon={
				error.isWarning
					? { code: error.icon || "alert-circle", color: "var(--color-admonition-note-br-h)" }
					: { code: error.icon || "circle-x", color: "var(--color-danger)" }
			}
			closeButton={error.title || error.isWarning ? { text: t("ok") } : null}
			isWarning={error.isWarning}
		>
			<div className={error.props?.html ? "article" : ""}>
				{error.props?.html ? (
					<span dangerouslySetInnerHTML={{ __html: error.message }} />
				) : (
					<span>{error.message}</span>
				)}
				{error.props?.showCause && error?.cause && (
					<Note title={t("technical-details")} collapsed={true} type={NoteType.hotfixes}>
						<Fence value={error.cause.stack} />
					</Note>
				)}
			</div>
		</InfoModalForm>
	);
};

export default DefaultErrorComponent;
