import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useRef, ChangeEvent as ReactChangeEvent } from "react";

interface FlagProps {
	id: string;
	value: boolean;
	preSubmit: (name: string, value: any, isDelete?: boolean) => void;
	onChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
}

const FlagWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5em;
`;

const Flag = ({ value, onChange, preSubmit, id }: FlagProps) => {
	const ref = useRef<HTMLInputElement>(null);

	const onClick = () => {
		const input = ref.current;
		const newValue = !value;
		const syntheticEvent = {
			target: { checked: newValue },
			currentTarget: { checked: newValue },
		} as ReactChangeEvent<HTMLInputElement>;

		if (input) {
			input.checked = newValue;
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}

		onChange(syntheticEvent);
		preSubmit(id, newValue, !newValue);
	};

	return (
		<FlagWrapper onClick={onClick}>
			<input ref={ref} type="checkbox" role="switch" readOnly checked={value} />
			<span>{value ? t("yes") : t("no")}</span>
		</FlagWrapper>
	);
};

export default Flag;
