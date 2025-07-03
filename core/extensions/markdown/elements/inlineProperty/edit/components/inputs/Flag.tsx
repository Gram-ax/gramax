import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useRef, ChangeEvent as ReactChangeEvent } from "react";

interface FlagProps {
	id: string;
	value: boolean;
	preSubmit: (name: string, value: any, isDelete?: boolean) => void;
	onChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
}

const ButtonWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5em;
`;

const Flag = ({ value, onChange, preSubmit, id }: FlagProps) => {
	const ref = useRef<HTMLInputElement>(null);

	const onClick = (value: boolean) => {
		const input = ref.current;
		const syntheticEvent = {
			target: { checked: value },
			currentTarget: { checked: value },
		} as ReactChangeEvent<HTMLInputElement>;

		if (input) {
			input.checked = value;
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}

		onChange(syntheticEvent);
		preSubmit(id, value, !value);
	};

	return (
		<>
			<ButtonWrapper onClick={() => onClick(true)}>
				<input ref={ref} type="radio" readOnly checked={value} />
				{t("yes")}
			</ButtonWrapper>
			<ButtonWrapper onClick={() => onClick(false)}>
				<input ref={ref} type="radio" readOnly checked={!value} />
				{t("no")}
			</ButtonWrapper>
		</>
	);
};

export default Flag;
