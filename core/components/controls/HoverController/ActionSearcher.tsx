import Tooltip from "@components/Atoms/Tooltip";
import ListLayout from "@components/List/ListLayout";
import styled from "@emotion/styled";
import { memo, useCallback } from "react";

interface ActionSearcherProps {
	items: string[];
	tooltipText?: string;
	placeholder?: string;
	onChange?: (lang?: string) => void;
	className?: string;
	defaultValue?: string;
}

const ActionSearcher = (props: ActionSearcherProps) => {
	const { tooltipText, items, placeholder, onChange, className, defaultValue } = props;
	const onCancelClick = useCallback(() => {
		onChange?.();
	}, [onChange]);

	return (
		<Tooltip content={tooltipText} delay={[500, 0]} customStyle>
			<div className={className}>
				<ListLayout
					useVirtuoso={false}
					placeholder={placeholder}
					appendTo="parent"
					items={items}
					onCancelClick={onCancelClick}
					onItemClick={onChange}
					item={defaultValue}
				/>
			</div>
		</Tooltip>
	);
};

export default memo(styled(ActionSearcher)`
	display: flex;
	padding: 0 0;
	border: 0;
	font-size: 0.65em;
	width: 100%;
	max-width: 13em;
	margin-right: 0.5em;

	i {
		color: var(--color-primary-general) !important;
	}

	i:hover {
		color: var(--color-primary) !important;
	}

	.transparent:hover {
		color: var(--color-primary-general) !important;
	}

	.items > .item {
		font-size: 1.7em;
		padding: 0.5em 0.75em;
	}

	> div {
		width: 100%;
	}

	input {
		color: var(--color-primary-general) !important;
		font-size: 0.85em !important;
		width: 100%;
	}

	.search {
		font-size: 0.65em;
		padding-right: 0 !important;
		height: 5em;
		border-radius: 0;
		background-color: transparent;
	}
`);
