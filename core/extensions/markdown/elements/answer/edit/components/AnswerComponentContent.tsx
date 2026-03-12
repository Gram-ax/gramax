import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { NodeViewContent } from "@tiptap/react";
import type { AnswerType } from "../../types";

const StyledContent = styled(NodeViewContent)`
	> div > :last-of-type {
		margin-bottom: 0;
	}
`;

export const AnswerComponentContent = ({ type }: { type: AnswerType }) => {
	if (type === "text") {
		return (
			<span className="text-muted cursor-default w-full" contentEditable={false}>
				{t("quiz.answer-placeholder.edit")}
			</span>
		);
	}

	return <StyledContent className="w-full" />;
};
