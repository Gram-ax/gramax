import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const SnipperError = styled(({ className }: { className?: string }) => {
	return (
		<div className={className} data-qa="qa-error-modal" data-focusable="true">
			<Note type={NoteType.danger} title={useLocalize("snippetRenderError")}>
				<div className="error-explanation">{useLocalize("cantGetSnippetData")}.</div>
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
`;

export default SnipperError;
