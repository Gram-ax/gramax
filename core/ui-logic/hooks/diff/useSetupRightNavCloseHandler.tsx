import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useEffect } from "react";

const useSetupRightNavCloseHandler = () => {
	const rightNavIsPin = SidebarsIsPinService.value.right;

	useEffect(() => {
		if (rightNavIsPin) {
			SidebarsIsPinService.isSidebarsDependent = false;
			SidebarsIsPinService.value = { right: false };
			SidebarsIsOpenService.value = { right: false };
		}
	}, []);
};

export default useSetupRightNavCloseHandler;
