import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import { getAvailableChildrens } from "@ext/markdown/elements/answer/edit/logic/getAvailableChildrens";
import { getLeftComponentByType } from "@ext/markdown/elements/answer/edit/logic/getLeftComponentByType";
import { AnswerContent, BaseAnswerContainer } from "@ext/markdown/elements/answer/render/components/Answer";
import type { AnswerType } from "@ext/markdown/elements/answer/types";
import type { QuizCorrect } from "@ext/markdown/elements/question/types";
import type { NodeViewProps } from "@tiptap/react";
import { IconButton } from "@ui-kit/Button";
import { memo, useCallback } from "react";
import { AnswerComponentContent } from "./AnswerComponentContent";

interface AnswerProps<T extends AnswerType = AnswerType> {
	correct: QuizCorrect;
	type: T;
	updateCorrect: () => void;
	deleteAnswer: () => void;
}

interface AnswerLeftProps {
	type: AnswerType;
	correct: QuizCorrect;
	updateCorrect: () => void;
}

const AnswerLeft = ({ type, correct, updateCorrect }: AnswerLeftProps) => {
	return getLeftComponentByType({ type, value: correct ?? false, onChange: updateCorrect });
};

const AnswerRight = ({ deleteAnswer }: { deleteAnswer: () => void }) => {
	return (
		<IconButton
			className="ml-auto h-auto p-0 pr-0.5"
			contentEditable={false}
			icon="trash"
			onClick={deleteAnswer}
			size="sm"
			variant="text"
		/>
	);
};

const Answer = memo(({ correct, type, updateCorrect, deleteAnswer }: AnswerProps) => {
	const { right, left, content } = getAvailableChildrens(type);

	return (
		<BaseAnswerContainer correct={correct}>
			<AnswerContent>
				{left && <AnswerLeft correct={correct} type={type} updateCorrect={updateCorrect} />}
				{content && <AnswerComponentContent type={type} />}
				{right && <AnswerRight deleteAnswer={deleteAnswer} />}
			</AnswerContent>
		</BaseAnswerContainer>
	);
});

const AnswerComponent = (props: NodeViewProps) => {
	const { node, deleteNode, editor, getPos } = props;
	const { type, correct } = node.attrs as { type: AnswerType; correct: boolean };

	const updateCorrect = useCallback(() => {
		if (type === "text") return;

		editor
			.chain()
			.focus(getPos() + 1)
			.command(({ tr, dispatch }) => {
				const newTr = tr.setNodeAttribute(getPos(), "correct", !correct);
				dispatch?.(newTr);
				return true;
			})
			.run();
	}, [editor, correct, getPos, type]);

	const deleteAnswer = useCallback(() => {
		deleteNode();
	}, [deleteNode]);

	return (
		<NodeViewContextableWrapper props={props}>
			<Answer correct={correct} deleteAnswer={deleteAnswer} type={type} updateCorrect={updateCorrect} />
		</NodeViewContextableWrapper>
	);
};

export default AnswerComponent;
