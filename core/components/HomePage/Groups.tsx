import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRouter } from "@core/Api/useRouter";
import { HomePageBreadcrumb, Section } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import FavoriteCatalogLinkService from "@ext/artilce/Favorite/components/FavoriteCatalogLinkService";
import t from "@ext/localization/locale/translate";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "ics-ui-kit/components/breadcrumb";
import { useState } from "react";
import Folder from "./Folder";
import Group from "./Group";

interface GroupsProps {
	className?: string;
	section: Section;
	breadcrumb: HomePageBreadcrumb[];
}

const Groups = (props: GroupsProps) => {
	const { className, section, breadcrumb } = props;
	const router = useRouter();
	const [isAnyCardLoading, setIsAnyCardLoading] = useState(false);
	const favoriteCatalogLinks = FavoriteCatalogLinkService.value;
	const sectionKeys = Object.keys(section.sections || {});
	const isMainPage = breadcrumb.length === 0;

	return (
		<div className={`${className} w-full pt-4 px-4`} style={isAnyCardLoading ? { pointerEvents: "none" } : {}}>
			<div className="mx-auto flex max-w-[1144px] flex-col gap-8 breadcrumb-container">
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumb.map((b, index) => (
							<>
								<BreadcrumbItem key={b.title}>
									{index !== breadcrumb.length - 1 ? (
										<BreadcrumbLink onClick={() => router.pushPath(b.href)}>
											{b.title}
										</BreadcrumbLink>
									) : (
										<BreadcrumbPage>{b.title}</BreadcrumbPage>
									)}
								</BreadcrumbItem>
								{index !== breadcrumb.length - 1 && (
									<BreadcrumbSeparator>
										<span className="text-muted">/</span>
									</BreadcrumbSeparator>
								)}
							</>
						))}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			<div className="mx-auto flex max-w-[1144px] flex-col gap-8">
				{!!favoriteCatalogLinks.length && isMainPage && (
					<Group
						title="favorites"
						catalogLinks={favoriteCatalogLinks}
						setIsAnyCardLoading={setIsAnyCardLoading}
					/>
				)}
				<div className="flex flex-col gap-6 pt-4">
					{isMainPage ? (
						<h3 className="text-center text-2xl font-semibold text-primary-fg pt-4">
							{t("groups-and-projects")}
						</h3>
					) : (
						<h3 className="text-center text-2xl font-semibold text-primary-fg pt-4">{section.title}</h3>
					)}
					{sectionKeys.length !== 0 && (
						<div className="group-container">
							{sectionKeys.map((sectionKey, index) => (
								<Folder key={sectionKey + index} section={section.sections[sectionKey]} />
							))}
						</div>
					)}
					{section && <Group catalogLinks={section.catalogLinks} setIsAnyCardLoading={setIsAnyCardLoading} />}
				</div>
			</div>
		</div>
	);
};

export default styled(Groups)`
	flex: 1;

	.group-container {
		gap: 1.5rem;
		display: flex;
		flex-wrap: wrap;
	}

	.breadcrumb-container {
		ol {
			list-style: none;
		}

		a:hover {
			color: hsl(var(--primary-fg)) !important;
		}
	}

	a {
		width: fit-content;
		font-weight: 300;
		color: var(--color-home-card-link);
		text-decoration: none;
		display: inline-block;
		position: relative;

		&:hover {
			color: var(--color-home-card-link-hover) !important;
		}
	}

	${cssMedia.narrow} {
		i + span {
			display: none;
		}
	}
`;
