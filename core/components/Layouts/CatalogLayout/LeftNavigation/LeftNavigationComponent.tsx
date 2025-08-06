import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import LeftNavViewContentContainer from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContainer";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import stopOpeningPanels from "@core-ui/utils/stopOpeningPanels ";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "./LeftNavigationBottom";
import LeftNavigationLayout from "./LeftNavigationLayout";
import LeftNavigationTop from "./LeftNavigationTop";

const navsSymbol = Symbol();

const LeftNavigationComponent = ({
	data,
	mediumMedia,
	delay,
}: {
	data: ArticlePageData;
	mediumMedia: boolean;
	delay?: number;
}) => {
	const isPin = SidebarsIsPinService.value.left;
	const [prevIsPin, setPrevIsPin] = useState<boolean>(undefined);
	const { isStaticCli } = usePlatform();

	const isOpen = SidebarsIsOpenService.value.left;

	const transitionEndIsOpen = SidebarsIsOpenService.transitionEndIsLeftOpen;
	const editor = EditorService?.getEditor();

	useEffect(() => {
		const onSelectionChange = () => stopOpeningPanels(navsSymbol, editor.view);

		editor?.on("selectionUpdate", onSelectionChange);
		return () => {
			editor?.off("selectionUpdate", onSelectionChange);
		};
	}, [editor]);

	const isLeftNavHover = useRef(false);
	const unpinAnimation = useRef(false);

	useLayoutEffect(() => {
		if (prevIsPin && !isPin) {
			SidebarsIsOpenService.value = { left: false };
			unpinAnimation.current = true;
		}
		setPrevIsPin(isPin);
	}, [isPin]);

	return (
		<div
			style={{ width: "fit-content" }}
			onMouseEnter={() => (isLeftNavHover.current = true)}
			onMouseLeave={() => (isLeftNavHover.current = false)}
		>
			<LeftNavigationLayout
				isStaticBuilding={isStaticCli}
				mediumMedia={mediumMedia}
				leftNavigationTop={<LeftNavigationTop data={data} />}
				leftNavigationContent={<LeftNavViewContentContainer itemLinks={data.itemLinks} />}
				leftNavigationBottom={<LeftNavigationBottom data={data} />}
				onMouseEnter={() =>
					setTimeout(() => {
						if (!isLeftNavHover.current || unpinAnimation.current) return;
						SidebarsIsOpenService.value = { left: true };
					}, delay)
				}
				onTransitionEnd={() => {
					SidebarsIsOpenService.transitionEndIsLeftOpen = isOpen;
					unpinAnimation.current = false;
				}}
				transitionEndIsOpen={transitionEndIsOpen}
				isOpen={isOpen}
				isPin={isPin}
			/>
		</div>
	);
};

export default LeftNavigationComponent;
