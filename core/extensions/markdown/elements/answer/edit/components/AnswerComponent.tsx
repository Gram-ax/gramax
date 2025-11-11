import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import { NodeViewContent, NodeViewProps } from "@tiptap/react";
import styled from "@emotion/styled";
import { getComponentByType } from "@ext/markdown/elements/answer/edit/logic/getComponentByType";
import { memo, useCallback } from "react";
import { IconButton } from "@ui-kit/Button";
import { AnswerContent, BaseAnswer } from "@ext/markdown/elements/answer/render/components/Answer";
import { AnswerType } from "@ext/markdown/elements/answer/types";

interface AnswerProps<T extends AnswerType = AnswerType> {
	correct: boolean;
	type: T;
	updateCorrect: () => void;
	deleteAnswer: () => void;
}

const StyledContent = styled(NodeViewContent)`
	> div > :last-of-type {
		margin-bottom: 0;
	}
`;

const AnswerLeft = ({ type, correct, updateCorrect }: { type: any; correct: boolean; updateCorrect: () => void }) => {
	return getComponentByType({ type, value: correct, onClick: updateCorrect });
};

const AnswerRight = ({ deleteAnswer }: { deleteAnswer: () => void }) => {
	return (
		<IconButton
			icon="trash"
			size="sm"
			contentEditable={false}
			variant="text"
			onClick={deleteAnswer}
			className="ml-auto h-auto p-0 pr-0.5"
		/>
	);
};

const Answer = memo(({ correct, type, updateCorrect, deleteAnswer }: AnswerProps) => {
	return (
		<BaseAnswer correct={!!correct}>
			<AnswerContent>
				<AnswerLeft type={type} correct={correct} updateCorrect={updateCorrect} />
				<StyledContent className="w-full" />
				<AnswerRight deleteAnswer={deleteAnswer} />
			</AnswerContent>
		</BaseAnswer>
	);
});

const AnswerComponent = (props: NodeViewProps) => {
	const { node, deleteNode, editor, getPos } = props;
	const { type, correct } = node.attrs as { type: AnswerType; correct: boolean };

	const updateCorrect = useCallback(() => {
		editor
			.chain()
			.focus(getPos() + 1)
			.command(({ tr, dispatch }) => {
				const newTr = tr.setNodeAttribute(getPos(), "correct", !correct);
				dispatch?.(newTr);
				return true;
			})
			.run();
	}, [editor, correct, getPos]);

	const deleteAnswer = useCallback(() => {
		deleteNode();
	}, [deleteNode]);

	return (
		<NodeViewContextableWrapper props={props}>
			<Answer correct={correct} type={type} updateCorrect={updateCorrect} deleteAnswer={deleteAnswer} />
		</NodeViewContextableWrapper>
	);
};

export default AnswerComponent;
