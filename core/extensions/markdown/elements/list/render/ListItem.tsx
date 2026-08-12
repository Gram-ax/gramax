import { cn } from "@core-ui/utils/cn";
import type { ChangeEvent, FC, ReactNode } from "react";

export interface ListItemProps {
	checked?: boolean;
	isTaskItem?: null | boolean;
	children?: ReactNode;
	className?: string;
	isReadOnly?: boolean;
	onChangeHandler?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const TaskItemView: FC<ListItemProps> = (props) => {
	const { checked, className, onChangeHandler, isReadOnly, children } = props;

	return (
		<li className={cn("task-item", className)} data-checked={checked}>
			<label contentEditable={false}>
				<input checked={checked} onChange={onChangeHandler} readOnly={isReadOnly} type="checkbox" />
			</label>
			<div>{children}</div>
		</li>
	);
};

const DefaultListItem = ({ children, className }: ListItemProps) => {
	return <li className={className}>{children}</li>;
};

const ListItem: FC<ListItemProps> = (props) => {
	const Tag = props.isTaskItem ? TaskItemView : DefaultListItem;

	return <Tag {...props} />;
};

export default ListItem;
