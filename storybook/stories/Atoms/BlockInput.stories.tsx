import BlockInputSrc from "@components/Atoms/BlockInput";
import { ComponentMeta } from "@storybook/react";
import { useState } from "react";

export default {
	title: "DocReader/Atoms/BlockInput",
	args: {
		placeholder: "placeholder",
		value: "defaultValue",
	},
} as ComponentMeta<typeof BlockInput>;

export const BlockInput = (args: { placeholder: string; value: string }) => {
	const [value, setValue] = useState(args.value);
	return (
		<BlockInputSrc
			value={value}
			onInput={(e) => {
				setValue(e.currentTarget.innerText);
			}}
		/>
	);
};
