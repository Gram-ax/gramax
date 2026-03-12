import t from "@ext/localization/locale/translate";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { type ChangeEvent, memo, useCallback } from "react";
import type { AnswerType, AnswerValueType } from "../../types";

interface BaseComponentProps<T extends AnswerType> {
	value: AnswerValueType<T>;
	disabled?: boolean;
	onChange?: (value: AnswerValueType<T>) => void;
}

interface Props<T extends AnswerType = AnswerType> extends BaseComponentProps<T> {
	type: T;
}

const TextComponent = memo((props: BaseComponentProps<"text">): JSX.Element => {
	const { value, onChange, disabled } = props;

	const onChangeHandler = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e.target.value);
		},
		[onChange],
	);

	return (
		<AutogrowTextarea
			className="border border-secondary-border bg-secondary-bg hover:bg-secondary-bg-hover transition-all text-primary-fg hover:border-primary-border disabled:cursor-not-allowed disabled:bg-primary-bg disabled:shadow-soft-sm disabled:pointer-events-none"
			disabled={disabled}
			minRows={1}
			onChange={onChangeHandler}
			placeholder={t("quiz.answer-placeholder.render")}
			value={value}
		/>
	);
});

export const getRenderComponentByType = <T extends AnswerType>(props: Props<T>): JSX.Element => {
	const { type, ...restProps } = props;

	switch (type) {
		case "text":
			return <TextComponent {...(restProps as BaseComponentProps<"text">)} />;
		default:
			return null;
	}
};
