import CatalogActions from "@components/Actions/CatalogActions";
import { TextSize } from "@components/Atoms/Button/Button";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import Url from "@core-ui/ApiServices/Types/Url";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import Search from "../../Actions/Modal/Search";
import Link from "../../Atoms/Link";
import Logo from "../../Logo";
import InboxService from "@ext/inbox/components/InboxService";
import NotificationIcon from "@components/Layouts/LeftNavigationTabs/NotificationIcon";
import TemplateService from "@ext/templates/components/TemplateService";

interface TopBarContentProps {
	data: ArticlePageData;
	isMacDesktop: boolean;
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: LeftNavigationTab) => void;
	className?: string;
}

const TopBarContent = ({ data, isMacDesktop, currentTab, setCurrentTab, className }: TopBarContentProps) => {
	const logoImageUrl = PageDataContextService.value.conf.logo.imageUrl;
	const catalogProps = CatalogPropsService.value;
	const isCatalogExist = !!catalogProps.name;
	const { isStatic, isStaticCli } = usePlatform();
	const showHomePageButton = !(isStatic || isStaticCli || logoImageUrl);

	const { notes } = InboxService.value;
	const { templates } = TemplateService.value;

	const onCloseInbox = () => {
		InboxService.removeAllNotes();
	};

	const onCloseTemplate = () => {
		TemplateService.closeTemplate();
		TemplateService.setTemplates([]);
		refreshPage();
	};

	return (
		<div className={className}>
			{showHomePageButton && (
				<Link className="home" href={Url.fromRouter(useRouter(), { pathname: "/" })} dataQa="home-page-button">
					<ButtonLink textSize={TextSize.L} iconCode="grip" />
				</Link>
			)}
			<Logo imageUrl={logoImageUrl} />
			<div className="iconWrapper">
				{currentTab === LeftNavigationTab.Inbox && (
					<NotificationIcon
						iconCode="inbox"
						count={notes.length}
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onCloseInbox}
					/>
				)}
				{currentTab === LeftNavigationTab.Template && (
					<NotificationIcon
						count={templates.size}
						iconCode="layout-template"
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onCloseTemplate}
					/>
				)}
				<Search isHomePage={false} catalogLinks={[data.catalogProps.link]} itemLinks={data.itemLinks} />
				<CatalogActions
					isCatalogExist={isCatalogExist}
					itemLinks={data.itemLinks}
					currentTab={currentTab}
					setCurrentTab={setCurrentTab}
				/>
			</div>
		</div>
	);
};

export default styled(TopBarContent)`
	gap: 14px;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.home {
		display: flex;
	}

	.iconWrapper {
		display: flex;
		gap: 0.5em;
		align-items: center;
		vertical-align: middle;
	}
`;
