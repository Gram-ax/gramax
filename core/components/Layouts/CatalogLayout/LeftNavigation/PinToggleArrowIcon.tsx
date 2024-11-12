import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import styled from "@emotion/styled";

const PinToggleArrowIcon = styled(({ className }: { className?: string }) => {
	const isPin = SidebarsIsPinService.value;
	return (
		<div className={className}>
			<ButtonLink
				iconFw={false}
				textSize={TextSize.L}
				iconCode={isPin ? "arrow-left-from-line" : "arrow-right-from-line"}
				onClick={() => {
					SidebarsIsPinService.value = !isPin;
					if (!isPin) LeftNavigationIsOpenService.value = true;
				}}
			/>
		</div>
	);
})`
	width: 100%;
	display: flex;
	align-items: center;
`;

export default PinToggleArrowIcon;
