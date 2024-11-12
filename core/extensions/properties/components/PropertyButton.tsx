import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";

type InputType = "radio" | "checkbox";
interface PropertyButtonProps {
	name: string;
	checked: boolean;
	onClick: (e) => void;
	canMany?: boolean;
	inputType?: InputType;
	indeterminate?: boolean;
}

const getInput = (type: InputType, props: PropertyButtonProps): React.ReactNode => {
	switch (type) {
		case "radio":
			return <input type="radio" checked={props.checked} />;
		case "checkbox":
			return <Checkbox disabled indeterminate={props.indeterminate} checked={props.checked} />;
		default:
			return null;
	}
};

const PropertyButton = (props: PropertyButtonProps) => {
	const { name, onClick, canMany, inputType = "checkbox" } = props;
	return (
		<div onClick={onClick}>
			<Button
				style={{ gap: "var(--distance-i-span)", fontSize: "0.75rem" }}
				buttonStyle={ButtonStyle.transparent}
				textSize={TextSize.XS}
			>
				{canMany && getInput(inputType, props)}
				<span>{name}</span>
			</Button>
		</div>
	);
};

export default PropertyButton;
