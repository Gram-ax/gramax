import ExtensionBarLayout from "../ExtensionBarLayout";

const StatusBar = ({
	leftElements,
	rightElements,
	padding = "0 6px",
	isOffline,
}: {
	leftElements?: JSX.Element[];
	rightElements?: JSX.Element[];
	padding?: string;
	isOffline?: boolean;
	onClick?: () => void;
}) => {
	return (
		<ExtensionBarLayout
			background={isOffline ? "var(--version-control-offline)" : "var(--version-control-primary)"}
			dataState={isOffline ? "offline" : ""}
			height="var(--status-bar-height)"
			leftExtensions={leftElements}
			padding={padding}
			rightExtensions={rightElements}
		/>
	);
};
export default StatusBar;
