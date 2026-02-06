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
		<InfoModalForm closeButton={{ text: t("ok") }} onCancelClick={onCancelClick} title={t("clone-fail")}>
			<div className="article">
				<Wrapper>
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
				</Wrapper>

				{cause && (
					<Note collapsed={true} title={t("technical-details")} type={NoteType.hotfixes}>
						<CodeBlock
							value={
								cause.stack.includes("Fn:")
									? cause.stack
									: `${cause.name}: ${cause.message}\n${cause.stack}`
							}
						/>
					</Note>
				)}
			</div>
		</InfoModalForm>
	);
};

export default CloneErrorComponent;
