import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useCallback } from "react";

const useRestoreRightSidebar = () => {
	const sidebarsIsPin = SidebarsIsPinService.value;

	const restoreRightSidebar = useCallback(() => {
		SidebarsIsPinService.isSidebarsDependent = true;
		if (!sidebarsIsPin.right && sidebarsIsPin.left) {
			SidebarsIsPinService.value = { right: true };
		}
	}, [sidebarsIsPin.left, sidebarsIsPin.right]);

	return restoreRightSidebar;
};

export default useRestoreRightSidebar;
