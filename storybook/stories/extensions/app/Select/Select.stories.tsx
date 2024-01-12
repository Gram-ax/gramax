import SelectSrc from "@components/Select/Select";
import { Meta } from "@storybook/react";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

export default {
	title: "gx/extensions/app/Select",
	args: {
		create: true,
		loading: true,
		disabled: false,
		clearable: true,
		placeholder: "Select...",
		addPlaceholder: "addPlaceholder",
		createNewLabel: "Добавить значение {search}",
	},
	decorators: [
		(Story) => (
			<div style={{ width: "500px" }}>
				<Story />
			</div>
		),
		BlockDecorator,
	],
} as Meta<typeof SelectSrc>;

export const DefaultSelect = (props) => {
	return (
		<SelectSrc
			{...props}
			values={[{ value: "lolekek", label: "lolekek" }]}
			options={[
				{ value: "lolekek", label: "lolekek" },
				{ value: "ics-it", label: "ics-it" },
				{ value: "ics-it", label: "ics-it" },
				{ value: "ics-it", label: "ics-it" },
			]}
			onChange={(values) => {
				console.log(values);
			}}
		/>
	);
};
