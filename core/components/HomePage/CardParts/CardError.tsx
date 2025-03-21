import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import RightBottomExtWrapper from "@components/HomePage/CardParts/RightBottomExt";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";

const IconWrapper = styled.div`
	cursor: pointer;
	line-height: 100%;
	color: var(--color-danger);
	opacity: 0.7;

	:hover {
		opacity: 1;
	}
`;

const CardError = ({ link, error }: { link: CatalogLink; error: DefaultError }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<RightBottomExtWrapper>
			<Tooltip content={<span>{t("clickToViewDetails")}</span>}>
				<IconWrapper>
					<Icon
						onClick={async () => {
							ErrorConfirmService.notify(error);
							await FetchService.fetch(apiUrlCreator.getRemoveCloneCatalogUrl(link.name));
							ErrorConfirmService.onModalClose = async () => {
								await refreshPage();
							};
						}}
						code="circle-x"
					/>
				</IconWrapper>
			</Tooltip>
		</RightBottomExtWrapper>
	);
};

export default CardError;
