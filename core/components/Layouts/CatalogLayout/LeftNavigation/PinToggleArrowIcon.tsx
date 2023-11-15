import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import styled from "@emotion/styled";
import Icon from "../../../Atoms/Icon";

const PinToggleArrowIcon = styled(({ className }: { className?: string }) => {
	const isPin = SidebarsIsPinService.value;
	return (
		<div className={className}>
			<Icon
				isAction
				code={isPin ? "arrow-left-from-line" : "arrow-right-from-line"}
				onClick={() => {
					if (isPin) SidebarsIsPinService.value = false;
					else {
						SidebarsIsPinService.value = true;
						LeftNavigationIsOpenService.value = true;
					}
				}}
			/>
		</div>
	);
})`
	width: 100%;
	display: flex;
	align-items: center;
	font-size: var(--big-icon-size);
`;

export default PinToggleArrowIcon;
