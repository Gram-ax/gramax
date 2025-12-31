import { PopoverContent } from "@ui-kit/Popover";
import styled from "@emotion/styled";

export const AnimatedPopoverContent = styled(PopoverContent)`
	animation-name: slideDown !important;

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;
