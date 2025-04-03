import styled from "@emotion/styled";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";

const Wrapper = styled.div`
	margin-bottom: 1rem;
`;

const CloneErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const cause = (error.cause?.cause || error.cause) as Error;

	return (
		<InfoModalForm onCancelClick={onCancelClick} title={t("clone-fail")} closeButton={{ text: t("ok") }}>
			<div className="article">
				<Wrapper>
					{t("clone-error-desc1")}{" "}
					<a href={error.props.repUrl} target="_blank" rel="noreferrer">
						{error.props.repUrl}
					</a>
					. {t("clone-error-desc2")}
				</Wrapper>

				{cause && (
					<Note title={t("technical-details")} collapsed={true} type={NoteType.hotfixes}>
						<CodeBlock value={cause.name + ": " + cause.message + "\n" + cause.stack} />
					</Note>
				)}
			</div>
		</InfoModalForm>
	);
};

export default CloneErrorComponent;
