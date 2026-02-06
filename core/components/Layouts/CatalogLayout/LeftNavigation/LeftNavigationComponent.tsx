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
			onMouseEnter={() => (isLeftNavHover.current = true)}
			onMouseLeave={() => (isLeftNavHover.current = false)}
			style={{ width: "fit-content" }}
		>
			<LeftNavigationLayout
				isOpen={isOpen}
				isPin={isPin}
				isStaticBuilding={isStaticCli}
				leftNavigationBottom={<LeftNavigationBottom data={data} />}
				leftNavigationContent={<LeftNavViewContentContainer itemLinks={data.itemLinks} />}
				leftNavigationTop={<LeftNavigationTop data={data} />}
				mediumMedia={mediumMedia}
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
			/>
		</div>
	);
};

export default LeftNavigationComponent;
