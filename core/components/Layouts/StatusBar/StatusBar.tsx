import ExtensionBarLayout from "../ExtensionBarLayout";

const StatusBar = ({
	leftElements,
	rightElements,
	padding = "0 6px",
}: {
	leftElements?: JSX.Element[];
	rightElements?: JSX.Element[];
	padding?: string;
}) => {
	return (
		<ExtensionBarLayout
			background="var(--version-control-primary)"
			height="var(--status-bar-height)"
			leftExtensions={leftElements}
			padding={padding}
			rightExtensions={rightElements}
		/>
	);
};
export default StatusBar;
