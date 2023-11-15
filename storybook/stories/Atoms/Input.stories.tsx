import InputSrc from "@components/Atoms/Input";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

export const Input = ({
	...props
}: {
	value: string;
	icon?: string;
	placeholder?: string;
	endText?: string;
	startText?: string;
	isCode?: boolean;
	isErrorValue?: boolean;
}) => {
	return <InputSrc {...props} onChange={() => {}} />;
};

const InputData = {
	title: "DocReader/Atoms/Input",
	argTypes: {
		value: { defaultValue: "Text", type: { name: "string", required: true }, description: "`string`" },
		icon: { defaultValue: "link", type: { required: false }, description: "`string`" },
		placeholder: { defaultValue: "placeholder", type: { required: false }, description: "`string`" },
		endText: { defaultValue: "endText", type: { required: false }, description: "`string`" },
		startText: { defaultValue: "startText", type: { required: false }, description: "`string`" },
		isCode: { defaultValue: true, type: { required: false }, description: "`boolean`" },
		isErrorValue: { defaultValue: false, type: { required: false }, description: "`boolean`" },
	},
	decorators: [InlineDecorator],
	component: Input,
};

export default InputData;
