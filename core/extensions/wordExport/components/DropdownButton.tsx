import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { forwardRef, Ref } from "react";

interface DropdownButtonProps {
	iconCode: string;
	text: string;
	className?: string;
	disabled?: boolean;
}

const DropdownButton = forwardRef((props: DropdownButtonProps, ref: Ref<HTMLDivElement>) => {
	const { iconCode, text, className, disabled } = props;
	return (
		<div className={`export-button ${className}`} ref={ref}>
			<ButtonLink disabled={disabled} iconCode={iconCode} text={text} />
			{!disabled && <Icon code="chevron-right" />}
		</div>
	);
});

export default styled(DropdownButton)`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	gap: 5px;
`;
