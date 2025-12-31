import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

const ToolbarWrapper = styled.div`
	pointer-events: auto;

	@media only screen and (max-width: 1163px) {
		.hidden {
			display: none;
		}
	}

	[role="article-toolbar"] {
		flex-wrap: wrap;
	}

	${cssMedia.narrow} {
		[role="article-toolbar"],
		[role="article-inline-toolbar"] {
			flex-wrap: nowrap;
			border-radius: 0;
		}

		[role="toolbar"] {
			border-radius: 0;
		}
	}

	@media print {
		display: none !important;
	}
`;

export default ToolbarWrapper;
