import Divider from "../Atoms/Divider";

const ActionListItem = ({ children }: { children: JSX.Element }) => {
	return (
		<div style={{ width: "100%" }}>
			{children}
			<Divider style={{ opacity: 0.5 }} />
		</div>
	);
};

export default ActionListItem;
