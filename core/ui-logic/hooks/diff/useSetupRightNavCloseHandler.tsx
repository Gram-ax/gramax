import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useCallback } from "react";

const useSetupRightNavCloseHandler = () => {
	const rightNavIsPin = SidebarsIsPinService.value.right;

	const setupRightNavCloseHandler = useCallback(() => {
		SidebarsIsPinService.isSidebarsDependent = false;
		if (rightNavIsPin) {
			SidebarsIsPinService.value = { right: false };
			SidebarsIsOpenService.value = { right: false };
		}
	}, [rightNavIsPin]);

	return setupRightNavCloseHandler;
};

export default useSetupRightNavCloseHandler;
