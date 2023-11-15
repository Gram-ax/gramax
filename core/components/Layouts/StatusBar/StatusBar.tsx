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
			padding={padding}
			height="var(--status-bar-height)"
			background="var(--version-control-primary)"
			leftExtensions={leftElements}
			rightExtensions={rightElements}
		/>
	);
};
export default StatusBar;
