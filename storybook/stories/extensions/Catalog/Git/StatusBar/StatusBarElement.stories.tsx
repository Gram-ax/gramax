import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import InlineDecorator from "../../../../../styles/decorators/InlineDecorator";

const StatusBarData = {
	title: "gx/extensions/Catalog/Git/StatusBarElement",
	decorators: [InlineDecorator],
};

export const Icon = () => {
	return (
		<div style={{ background: "green", height: "25px", width: "fit-content" }}>
			<StatusBarElement tooltipText="tooltip" iconCode="source-branch" iconStrokeWidth="1.6" />
		</div>
	);
};

export const Text = () => {
	return (
		<div style={{ background: "green", height: "25px", width: "fit-content" }}>
			<StatusBarElement tooltipText="tooltip">
				<div>master</div>
			</StatusBarElement>
		</div>
	);
};

export const IconWithText = () => {
	return (
		<div style={{ background: "green", height: "25px", width: "fit-content" }}>
			<StatusBarElement tooltipText="tooltip" iconCode="source-branch" iconStrokeWidth="1.6">
				<div>master</div>
			</StatusBarElement>
		</div>
	);
};

export default StatusBarData;
