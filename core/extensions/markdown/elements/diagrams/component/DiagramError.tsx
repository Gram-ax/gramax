import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const DiagramError = styled(({ error, className }: { error: Error; className?: string }) => {
	return (
		<div className={className} data-qa="qa-error-modal">
			<Note type={NoteType.danger} title={useLocalize("diagramRenderFailed")}>
				<>
					<div className="error-explanation">{useLocalize(error.message as any)}</div>
					<Note title={useLocalize("techDetails")} collapsed={true} type={NoteType.danger}>
						<Fence value={error.stack} />
					</Note>
				</>
			</Note>
		</div>
	);
})`
	.admonition-danger .admonition-danger {
		background-color: transparent;
		border-left: none;
		margin: 0;
		padding: 0;
	}

	.error-explanation {
		padding-bottom: 16px;
	}

	pre {
		margin: 1rem 0;
		padding: 12px 16px !important;
	}
`;

export default DiagramError;
