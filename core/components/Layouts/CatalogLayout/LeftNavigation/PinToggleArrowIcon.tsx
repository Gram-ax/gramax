import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import styled from "@emotion/styled";

const PinToggleArrowIcon = styled(({ className }: { className?: string }) => {
	const isPin = SidebarsIsPinService.value.left;
	const isDependent = SidebarsIsPinService.isSidebarsDependent;
	return (
		<div className={className}>
			<ButtonLink
				iconCode={isPin ? "arrow-left-from-line" : "arrow-right-from-line"}
				iconFw={false}
				onClick={() => {
					SidebarsIsPinService.value = { left: !isPin };
					if (!isPin) SidebarsIsOpenService.value = { left: true, right: isDependent ? true : undefined };
				}}
				textSize={TextSize.L}
			/>
		</div>
	);
})`
	width: 100%;
	display: flex;
	align-items: center;
`;

export default PinToggleArrowIcon;
