import { classNames } from "@components/libs/classNames";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import styled from "@emotion/styled";
import DiffBottomBar from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { ComponentProps } from "react";
import { createPortal } from "react-dom";

const DiffBottomBarWrapper = styled.div`
	&.left-nav-is-pin {
		left: calc((100vw - var(--left-nav-width)) / 2 + var(--left-nav-width));
	}

	&.left-nav-is-unpin {
		left: calc(100vw / 2);
	}

	transform: translateX(-50%);
	position: absolute;
	width: 40vw;
	z-index: var(--z-index-base);
	bottom: 0;
`;

const RenderDiffBottomBarInBody = (props: ComponentProps<typeof DiffBottomBar>) => {
	const leftNavIsPin = SidebarsIsPinService.value.left;

	return createPortal(
		<DiffBottomBarWrapper
			className={classNames("diff-bottom-bar-wrapper", {
				"left-nav-is-pin": leftNavIsPin,
				"left-nav-is-unpin": !leftNavIsPin,
			})}
		>
			<DiffBottomBar {...props} />
		</DiffBottomBarWrapper>,
		document.body,
	);
};

export default RenderDiffBottomBarInBody;
