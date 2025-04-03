import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { forwardRef, Ref } from "react";

interface ExportButtonProps {
	iconCode: string;
	text: string;
	className?: string;
	disabled?: boolean;
}

const ExportButton = forwardRef((props: ExportButtonProps, ref: Ref<HTMLDivElement>) => {
	const { iconCode, text, className, disabled } = props;
	return (
		<div className={`export-button ${className}`} ref={ref}>
			<ButtonLink disabled={disabled} iconCode={iconCode} text={text} />
			{!disabled && <Icon code="chevron-right" />}
		</div>
	);
});

export default styled(ExportButton)`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	gap: 5px;
`;
