import HoverableActions from "@components/controls/HoverController/HoverableActions";
import t from "@ext/localization/locale/translate";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import QuestionActions from "@ext/markdown/elements/question/edit/components/QuestionActions";
import { BaseQuestion } from "@ext/markdown/elements/question/render/components/Question";
import { NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { Button } from "@ui-kit/Button";
import { memo, useCallback, useRef, useState } from "react";
import type { QuestionType } from "../../types";

const QuestionBottom = ({ addAnswer }: { addAnswer: () => void }) => {
	return (
		<Button
			className="ml-auto w-full"
			contentEditable={false}
			onPointerDown={addAnswer}
			startIcon="plus"
			variant="outline"
		>
			{t("editor.question.answer.add")}
		</Button>
	);
};

const Question = memo(
	({ addAnswer, required, type }: { addAnswer: () => void; required: boolean; id: string; type: QuestionType }) => {
		return (
			<BaseQuestion required={required}>
				<NodeViewContent />
				{type !== "text" && <QuestionBottom addAnswer={addAnswer} />}
			</BaseQuestion>
		);
	},
);

const QuestionComponent = (props: NodeViewProps) => {
	const { editor, getPos, node } = props;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const type = node.attrs.type as QuestionType;

	const addAnswer = useCallback(() => {
		const node = editor.state.doc.nodeAt(getPos());
		if (!node) return;
		const insertPos = getPos() + node.nodeSize - 1;

		editor.chain().focus(insertPos).addQuestionAnswer().run();
	}, [editor, getPos]);

	return (
		<NodeViewContextableWrapper props={props} ref={hoverElementRef}>
			<div className="mb-4 mt-4">
				<HoverableActions
					hoverElementRef={hoverElementRef}
					isHovered={isHovered}
					rightActions={<QuestionActions editor={editor} getPos={getPos} node={node} />}
					setIsHovered={setIsHovered}
				>
					<Question addAnswer={addAnswer} id={node.attrs.id} required={node.attrs.required} type={type} />
				</HoverableActions>
			</div>
		</NodeViewContextableWrapper>
	);
};

export default QuestionComponent;
