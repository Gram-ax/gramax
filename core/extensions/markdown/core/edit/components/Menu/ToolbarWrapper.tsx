import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

const ToolbarWrapper = styled.div`
	border-radius: var(--radius-large);

	> div > div {
		flex-wrap: wrap;
	}

	pointer-events: auto;

	@media only screen and (max-width: 1163px) {
		.hidden {
			display: none;
		}

		> div > div {
			max-width: 331px;
		}
	}

	${cssMedia.medium} {
		.hidden {
			display: block;
		}

		> div > div {
			max-width: fit-content;
		}
	}

	${cssMedia.narrow} {
		max-width: fit-content;

		> div > div {
			flex-wrap: nowrap;
			max-width: 95vw;
			overflow: scroll;
		}
	}
`;

export default ToolbarWrapper;