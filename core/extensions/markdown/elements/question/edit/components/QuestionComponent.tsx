import HoverableActions from "@components/controls/HoverController/HoverableActions";
import generateUniqueID from "@core/utils/generateUniqueID";
import t from "@ext/localization/locale/translate";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import QuestionActions from "@ext/markdown/elements/question/edit/components/QuestionActions";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import { BaseQuestion } from "@ext/markdown/elements/question/render/components/Question";
import { NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Button } from "@ui-kit/Button";
import { memo, useCallback, useRef, useState } from "react";

const QuestionBottom = ({ addAnswer }: { addAnswer: () => void }) => {
	return (
		<Button className="ml-auto w-full" onPointerDown={addAnswer} startIcon="plus" variant="outline">
			{t("editor.question.answer.add")}
		</Button>
	);
};

const Question = memo(({ addAnswer, required }: { addAnswer: () => void; required: boolean; id: string }) => {
	return (
		<BaseQuestion required={required}>
			<NodeViewContent />
			<QuestionBottom addAnswer={addAnswer} />
		</BaseQuestion>
	);
});

const QuestionComponent = (props: NodeViewProps) => {
	const { editor, getPos, node } = props;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const [isHovered, setIsHovered] = useState(false);

	const addAnswer = useCallback(() => {
		const node = editor.state.doc.nodeAt(getPos());
		if (!node) return;
		const insertPos = getPos() + node.nodeSize - 1;

		editor
			.chain()
			.focus(insertPos)
			.setQuestionAnswer(insertPos, {
				questionId: node.attrs.id,
				answerId: generateUniqueID(),
				type: answerTypeByQuestionType[node.attrs.type],
			})
			.run();
	}, [editor, getPos, node.attrs.id, node.attrs.type]);

	return (
		<NodeViewContextableWrapper props={props} ref={hoverElementRef}>
			<div className="mb-4 mt-4">
				<HoverableActions
					hoverElementRef={hoverElementRef}
					isHovered={isHovered}
					rightActions={<QuestionActions editor={editor} getPos={getPos} node={node} />}
					setIsHovered={setIsHovered}
				>
					<Question addAnswer={addAnswer} id={node.attrs.id} required={node.attrs.required} />
				</HoverableActions>
			</div>
		</NodeViewContextableWrapper>
	);
};

export default QuestionComponent;
