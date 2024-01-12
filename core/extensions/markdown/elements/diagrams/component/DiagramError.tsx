import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import Cut from "@ext/markdown/elements/cut/render/component/Cut";
import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const DiagramError = styled(({ error, className }: { error: Error; className?: string }) => {
	return (
		<div className={className} data-qa="qa-error-modal">
			<Note type={NoteType.danger} title={useLocalize("diagramRenderFailed")}>
				<>
					<div className="error-explanation">{useLocalize(error.message as any)}</div>
					<Cut text={useLocalize("techDetails")} expanded={false}>
						<Fence value={error.stack} />
					</Cut>
				</>
			</Note>
		</div>
	);
})`
	.admonition-cut {
		border-left: none;
		padding-left: 0;
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
