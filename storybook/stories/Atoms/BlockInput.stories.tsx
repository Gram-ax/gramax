import BlockInputSrc from "@components/Atoms/BlockInput";
import { Meta } from "@storybook/react";
import { useState } from "react";

export default {
	title: "gx/Atoms/BlockInput",
	args: {
		placeholder: "placeholder",
		value: "defaultValue",
	},
} as Meta<typeof BlockInput>;

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
