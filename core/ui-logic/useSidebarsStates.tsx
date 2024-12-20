import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useCallback, useRef } from "react";

const useSidebarsStates = () => {
	const prevSidebarsDependentState = useRef<boolean>(undefined);
	const prevSidebarsIsPinState = useRef<{ left: boolean; right: boolean }>({ left: undefined, right: undefined });
	const prevSidebarsIsOpenState = useRef<{ left: boolean; right: boolean }>({ left: undefined, right: undefined });

	const sidebarsIsOpen = SidebarsIsOpenService.value;
	const sidebarsPin = SidebarsIsPinService.value;
	const sidebarsDependent = SidebarsIsPinService.isSidebarsDependent;

	const saveStates = useCallback(() => {
		prevSidebarsDependentState.current = sidebarsDependent;
		prevSidebarsIsPinState.current = sidebarsPin;
		prevSidebarsIsOpenState.current = sidebarsIsOpen;
	}, [sidebarsDependent, sidebarsPin, sidebarsIsOpen]);

	const loadStates = useCallback(() => {
		SidebarsIsPinService.isSidebarsDependent = prevSidebarsDependentState.current;
		SidebarsIsPinService.value = prevSidebarsIsPinState.current;
		SidebarsIsOpenService.value = prevSidebarsIsOpenState.current;
	}, []);

	return { saveStates, loadStates };
};

export default useSidebarsStates;
