import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { FC, ChangeEvent } from "react";
import { ReactNode } from "react";

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
		<li
			className={classNames("task-item", { "readonly-task-item": isReadOnly }, [className])}
			data-checked={checked}
		>
			<label contentEditable={false}>
				<input type="checkbox" checked={checked} readOnly={isReadOnly} onChange={onChangeHandler} />
			</label>
			<div>{children}</div>
		</li>
	);
};

const DefaultListItem = ({ children, className }: ListItemProps) => {
	return <li className={className}>{children}</li>;
};

const ListItem: FC<ListItemProps> = (props) => {
	const Tag = props?.isTaskItem ? TaskItemView : DefaultListItem;

	return <Tag {...props} />;
};

export default styled(ListItem)`
	&.task-item {
		list-style-type: none !important;
		position: relative;
		font-size: inherit;

		p {
			margin: unset;
			margin-bottom: 0.4em;
			line-height: 1.7em;
		}

		label {
			position: absolute;
			left: -18px;
			top: 2px;

			input {
				font-size: inherit;
				cursor: pointer;
				height: 0.8125em;
				width: 0.8125em;
			}
		}
	}

	&.readonly-task-item label {
		font-size: inherit;
		top: unset;
	}
`;
