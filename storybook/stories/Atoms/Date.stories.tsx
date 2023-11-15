import DateSource from "@components/Atoms/Date";

export const DateAtom = ({ date }: { date: number }) => {
	const newDate = new Date(date).toJSON();

	return (
		<div style={{ margin: "2rem" }}>
			<DateSource date={newDate} />
		</div>
	);
};

const data = {
	title: "DocReader/Atoms/DateAtom",
	argTypes: {
		date: {
			defaultValue: new Date(),
			type: { required: true },
			control: "date",
		},
	},
};
export default data;
