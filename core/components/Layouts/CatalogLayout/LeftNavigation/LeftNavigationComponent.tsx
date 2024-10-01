import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import LeftNavViewContentContainer from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContainer";
import useWatch from "@core-ui/hooks/useWatch";
import { useRef, useState, useEffect } from "react";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "./LeftNavigationBottom";
import LeftNavigationLayout from "./LeftNavigationLayout";
import LeftNavigationTop from "./LeftNavigationTop";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import stopOpeningPanels from "@core-ui/utils/stopOpeningPanels ";

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
	const [hideScroll, setHideScroll] = useState(true);

	const isPin = SidebarsIsPinService.value;
	const [prevIsPin, setPrevIsPin] = useState<boolean>(undefined);

	const isOpen = LeftNavigationIsOpenService.value;

	const transitionEndIsOpen = LeftNavigationIsOpenService.transitionEndIsOpen;
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

	useWatch(() => {
		if (prevIsPin && !isPin) {
			LeftNavigationIsOpenService.value = false;
			unpinAnimation.current = true;
			setHideScroll(true);
		}
		setPrevIsPin(isPin);
	}, [isPin]);

	useWatch(() => {
		if (!isOpen) setHideScroll(true);
	}, [isOpen]);

	return (
		<div
			style={{ width: "fit-content" }}
			onMouseEnter={() => (isLeftNavHover.current = true)}
			onMouseLeave={() => (isLeftNavHover.current = false)}
		>
			<LeftNavigationLayout
				mediumMedia={mediumMedia}
				hideScroll={hideScroll}
				leftNavigationTop={<LeftNavigationTop data={data} />}
				leftNavigationContent={<LeftNavViewContentContainer itemLinks={data.leftNavItemLinks} />}
				leftNavigationBottom={<LeftNavigationBottom data={data} />}
				onMouseEnter={() =>
					setTimeout(() => {
						if (!isLeftNavHover.current || unpinAnimation.current) return;
						LeftNavigationIsOpenService.value = true;
						setHideScroll(false);
					}, delay)
				}
				onTransitionEnd={() => {
					LeftNavigationIsOpenService.transitionEndIsOpen = isOpen;
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
