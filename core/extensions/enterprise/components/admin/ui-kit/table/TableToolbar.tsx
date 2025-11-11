interface TableToolbarProps {
	input?: React.ReactNode;
	children?: React.ReactNode;
}

export const TableToolbar = ({ children, input }: TableToolbarProps) => {
	return (
		<div className="flex items-center gap-3 py-4">
			{input}
			<div className="flex items-center gap-3 flex-shrink-0 ml-auto">{children}</div>
		</div>
	);
};
