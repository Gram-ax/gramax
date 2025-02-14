import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useCallback, useState } from "react";

const useRestoreRightSidebar = () => {
	const sidebarsIsPin = SidebarsIsPinService.value;
	const [isDevMode] = useState(() => getIsDevMode());

	const restoreRightSidebar = useCallback(() => {
		if (!isDevMode) return;
		if (!sidebarsIsPin.right && sidebarsIsPin.left) {
			SidebarsIsPinService.isSidebarsDependent = true;
			SidebarsIsPinService.value = { right: true };
		}
	}, [sidebarsIsPin.left, sidebarsIsPin.right, isDevMode]);

	return restoreRightSidebar;
};

export default useRestoreRightSidebar;
