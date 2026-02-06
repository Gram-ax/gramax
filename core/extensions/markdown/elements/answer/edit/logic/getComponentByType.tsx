import { AnswerType, AnswerValueType } from "@ext/markdown/elements/answer/types";
import { Checkbox } from "@ui-kit/Checkbox";
import { RadioGroup, RadioGroupItem } from "@ui-kit/RadioGroup";
import { memo } from "react";

interface BaseComponentProps<T extends AnswerType> {
	value: AnswerValueType<T>;
	disabled?: boolean;
	onClick?: () => void;
}

interface Props<T extends AnswerType = AnswerType> extends BaseComponentProps<T> {
	type: T;
}

const styles = { minWidth: "1rem", minHeight: "1rem" };

const CheckboxComponent = memo((props: BaseComponentProps<"checkbox">): JSX.Element => {
	const { value, onClick, disabled } = props;
	return (
		<Checkbox
			checked={value}
			contentEditable={false}
			data-selected={value}
			disabled={disabled}
			onClick={onClick}
			style={styles}
		/>
	);
});

const RadioComponent = memo((props: BaseComponentProps<"radio">): JSX.Element => {
	const { value, onClick, disabled } = props;

	return (
		<RadioGroup>
			<RadioGroupItem
				checked={value}
				data-selected={value}
				disabled={disabled}
				onPointerDown={onClick}
				value="1"
			/>
		</RadioGroup>
	);
});

function getComponentByType<T extends AnswerType>(props: Props<T>): JSX.Element {
	const { type, ...restProps } = props;

	switch (type) {
		case "checkbox":
			return <CheckboxComponent {...(restProps as BaseComponentProps<"checkbox">)} />;
		case "radio":
			return <RadioComponent {...(restProps as BaseComponentProps<"radio">)} />;
		default:
			throw new Error(`Unknown answer type: ${type}`);
	}
}

export { getComponentByType };
