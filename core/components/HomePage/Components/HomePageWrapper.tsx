import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import styled from "@emotion/styled";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import type React from "react";

const homePageWrapperClassName = "bg-primary-bg flex flex-col";
const HomePageWrapperDiv = styled.div`display: flex;
	flex-direction: column;
	height: 100%;
	overflow: auto;
	font-family: Roboto, sans-serif;

	.shadow-scroll > div {
		display: flex;
		flex-direction: column;
	}

	.groups {
		margin-top: 1.8rem;
	}

	> div:has(.scroll-area) {
		height: 100%;
	}

	.groups,
	.top-menu,
	.bottom-info,
	.search-container {
		width: 100%;
		max-width: 509px;
		margin-left: auto;
		margin-right: auto;
	}

	&.breakpoint-sm {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 100%;
			padding-right: 1rem;
			padding-left: 1rem;
		}
		.group-container {
			gap: 1.25rem;
		}
		.group-content {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		.top-shadow {
			top: 3.25rem;
		}

		.bottom-info {
			flex-direction: column !important;
		}

		[data-card] {
			min-width: 165px;
		}
	}

	&.breakpoint-md {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 902px;
			padding-right: 1.5rem;
			padding-left: 1.5rem;
		}
		.top-shadow {
			top: 3.25rem;
		}
		.group-container {
			gap: 1.25rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 0.75rem;
		}

		[data-card] {
			min-width: 171px;
		}
	}

	&.breakpoint-lg {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1173px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-card] {
			min-width: 188px;
		}
	}

	&.breakpoint-xl {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1144px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}
		[data-card] {
			min-width: 188px;
		}
	}

	&.breakpoint-2xl {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1144px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-card] {
			min-width: 188px;
		}
	}

	[data-catalog-card],
	[data-folder] {
		width: 100%;
	}`;

export const HomePageWrapper = ({ children }: { children: React.ReactNode }) => {
	const breakpoint = useBreakpoint();
	return (
		<HomePageWrapperDiv className={`breakpoint-${breakpoint} ${homePageWrapperClassName}`}>
			<ScrollShadowContainer
				shadowTopClassName="top-shadow"
				wrapperClassName="flex flex-col shadow-scroll h-full"
			>
				{children}
			</ScrollShadowContainer>
		</HomePageWrapperDiv>
	);
};
