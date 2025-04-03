import Divider from "../Atoms/Divider";

const ActionListItem = ({ children, divider = false }: { children: JSX.Element; divider?: boolean }) => {
	return (
		<div style={{ width: "100%" }}>
			{children}
			{divider && <Divider style={{ opacity: 0.5 }} />}
		</div>
	);
};

export default ActionListItem;
