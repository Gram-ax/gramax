import Card from "@components/HomePage/Card";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { GroupData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { Dispatch, SetStateAction } from "react";

const Group = ({
	groupData,
	setIsAnyCardLoading,
	className,
}: {
	groupData: GroupData;
	setIsAnyCardLoading: Dispatch<SetStateAction<boolean>>;
	className?: string;
}) => {
	return (
		<div className={className}>
			<div className="group-header">{groupData.title !== "null" && t(groupData.title as any)}</div>
			<div className="group-container">
				{groupData.catalogLinks.map((link) => (
					<Card
						key={link.name}
						link={link}
						style={groupData.style}
						onClick={() => setIsAnyCardLoading(true)}
					/>
				))}
			</div>
		</div>
	);
};

export default styled(Group)`
	.group-header {
		margin-bottom: 0.5rem;
	}

	.groups-container {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.group-container {
		gap: 1rem;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	@media only screen and (max-width: 80rem) {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		}
	}

	${cssMedia.mediumest} {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr 1fr;
		}
	}

	${cssMedia.medium} {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}

	${cssMedia.narrow} {
		.group-container {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media only screen and (max-width: 320px) {
		.group-container {
			grid-template-columns: 1fr;
		}
	}
`;
