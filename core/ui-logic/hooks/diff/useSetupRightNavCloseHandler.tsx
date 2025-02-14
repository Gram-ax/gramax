import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useEffect, useState } from "react";

const useSetupRightNavCloseHandler = () => {
	const [isDevMode] = useState(() => getIsDevMode());
	const rightNavIsPin = SidebarsIsPinService.value.right;

	useEffect(() => {
		if (!isDevMode) return;
		if (rightNavIsPin) {
			SidebarsIsPinService.isSidebarsDependent = false;
			SidebarsIsPinService.value = { right: false };
			SidebarsIsOpenService.value = { right: false };
		}
	}, []);
};

export default useSetupRightNavCloseHandler;
