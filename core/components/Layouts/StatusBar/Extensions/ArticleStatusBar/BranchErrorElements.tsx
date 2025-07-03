import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";

interface BranchErrorElementProps {
	errorText: string;
}

const BranchErrorElement = ({ errorText }: BranchErrorElementProps) => {
	return (
		<StatusBarElement
			iconCode="crossed-cloud"
			iconStyle={{ fontSize: "15px", fill: "white" }}
			tooltipText={errorText}
			disable
		/>
	);
};

export default BranchErrorElement;
