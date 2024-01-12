import DateSource from "@components/Atoms/Date";

export const DateAtom = ({ date }: { date: number }) => {
	const newDate = new Date(date).toJSON();
	return <DateSource date={newDate} />;
};

const data = {
	title: "gx/Atoms/DateAtom",
	argTypes: {
		date: {
			defaultValue: new Date(),
			type: { required: true },
			control: "date",
		},
	},
};
export default data;
