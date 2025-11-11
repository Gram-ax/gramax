import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import { NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Button } from "@ui-kit/Button";
import { memo, useCallback, useRef, useState } from "react";
import generateUniqueID from "@core/utils/generateUniqueID";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import { BaseQuestion } from "@ext/markdown/elements/question/render/components/Question";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import QuestionActions from "@ext/markdown/elements/question/edit/components/QuestionActions";
import t from "@ext/localization/locale/translate";

const QuestionBottom = ({ addAnswer }: { addAnswer: () => void }) => {
	return (
		<Button variant="outline" startIcon="plus" className="ml-auto w-full" onPointerDown={addAnswer}>
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
		<NodeViewContextableWrapper ref={hoverElementRef} props={props}>
			<div className="mb-4 mt-4">
				<HoverableActions
					hoverElementRef={hoverElementRef}
					setIsHovered={setIsHovered}
					isHovered={isHovered}
					rightActions={<QuestionActions node={node} getPos={getPos} editor={editor} />}
				>
					<Question addAnswer={addAnswer} required={node.attrs.required} id={node.attrs.id} />
				</HoverableActions>
			</div>
		</NodeViewContextableWrapper>
	);
};

export default QuestionComponent;
