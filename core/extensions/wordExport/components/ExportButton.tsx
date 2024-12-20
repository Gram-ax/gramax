import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { forwardRef, Ref } from "react";

interface ExportButtonProps {
	iconCode: string;
	text: string;
	className?: string;
}

const ExportButton = forwardRef((props: ExportButtonProps, ref: Ref<HTMLDivElement>) => {
	const { iconCode, text, className } = props;
	return (
		<div className={`export-button ${className}`} ref={ref}>
			<ButtonLink iconCode={iconCode} text={text} />
			<Icon code="chevron-right" />
		</div>
	);
});

export default styled(ExportButton)`
	display: flex;
	align-items: center;
	gap: 5px;
`;
