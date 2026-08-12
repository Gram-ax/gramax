export const NavigationDragPreview = ({ name }: { name: string }) => {
	return (
		<div className="flex h-7 items-center rounded-lg bg-secondary-bg p-1.5 pl-2 text-sm font-normal text-primary-fg opacity-85 shadow-md whitespace-nowrap overflow-hidden">
			{name}
		</div>
	);
};
