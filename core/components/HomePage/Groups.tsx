import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRouter } from "@core/Api/useRouter";
import { HomePageBreadcrumb, Section, Sections } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import FavoriteCatalogLinkService from "@ext/article/Favorite/components/FavoriteCatalogLinkService";
import t from "@ext/localization/locale/translate";

import { WorkspaceView } from "@ext/workspace/WorkspaceConfig";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@ui-kit/Breadcrumb";
import { ContentDivider } from "@ui-kit/Divider";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Group from "./Group";

interface GroupsProps {
	className?: string;
	section: Section;
	breadcrumb: HomePageBreadcrumb[];
	view?: WorkspaceView;
	group?: string;
}

interface ViewGroupProps {
	group?: string;
	section: Section;
	setIsAnyCardLoading: Dispatch<SetStateAction<boolean>>;
}

const SectionView = ({ section, setIsAnyCardLoading, group }: ViewGroupProps) => {
	const { folderViews, sectionViews } = Object.entries(section.sections || {}).reduce(
		(acc, [sectionKey, subSection]) => {
			const targetArray = subSection.view === WorkspaceView.section ? acc.sectionViews : acc.folderViews;
			targetArray[sectionKey] = subSection;
			return acc;
		},
		{
			sectionViews: {} as Sections,
			folderViews: {} as Sections,
		},
	);
	const sectionKeys = Object.keys(sectionViews || {});
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!group || !ref.current) return;
		const id = requestAnimationFrame(() => {
			ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
		return () => cancelAnimationFrame(id);
	}, [group]);

	return (
		<>
			{sectionKeys.map((sectionKey, index) => {
				const currentSection = section.sections[sectionKey];
				return (
					<div ref={group === sectionKey ? ref : null} key={sectionKey + index} className="scroll-conteiner">
						<Group
							setIsAnyCardLoading={setIsAnyCardLoading}
							catalogLinks={currentSection.catalogLinks}
							title={currentSection.title}
							sections={currentSection.sections}
						/>
					</div>
				);
			})}
			{sectionKeys.length > 0 && section.catalogLinks?.length > 0 && (
				<ContentDivider>
					<div className="text-medium text-center font-normal text-muted">{t("other")}</div>
				</ContentDivider>
			)}
			{section.catalogLinks && (
				<Group
					sections={folderViews}
					catalogLinks={section.catalogLinks}
					setIsAnyCardLoading={setIsAnyCardLoading}
				/>
			)}
		</>
	);
};

const FolderView = ({ section, setIsAnyCardLoading }: ViewGroupProps) => {
	return (
		<div className="flex flex-col gap-6 pt-4">
			{section.title && (
				<h3 className="text-center text-2xl font-semibold text-primary-fg pt-4">{section.title}</h3>
			)}
			{section && (
				<Group
					sections={section.sections}
					catalogLinks={section.catalogLinks}
					setIsAnyCardLoading={setIsAnyCardLoading}
				/>
			)}
		</div>
	);
};

const Groups = (props: GroupsProps) => {
	const { className, section, breadcrumb, group } = props;
	const router = useRouter();
	const [isAnyCardLoading, setIsAnyCardLoading] = useState(false);
	const favoriteCatalogLinks = FavoriteCatalogLinkService.value;

	const isMainPage = breadcrumb.length === 0;
	const ViewGroup = !isMainPage ? FolderView : SectionView;

	return (
		<div className={`${className}`} style={isAnyCardLoading ? { pointerEvents: "none" } : {}}>
			<div className="flex flex-col gap-8 breadcrumb-container">
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumb.map((b, index) => (
							<>
								<BreadcrumbItem key={b.title}>
									{index !== breadcrumb.length - 1 ? (
										<BreadcrumbLink onClick={() => router.pushPath(b.href)}>
											{index === 0 ? t("home") : b.title}
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
			<div className="mx-auto flex flex-col groups-container">
				{!!favoriteCatalogLinks.length && isMainPage && (
					<Group
						title={t("favorites")}
						catalogLinks={favoriteCatalogLinks}
						setIsAnyCardLoading={setIsAnyCardLoading}
					/>
				)}
				<ViewGroup section={section} setIsAnyCardLoading={setIsAnyCardLoading} group={group} />
			</div>
		</div>
	);
};

export default styled(Groups)`
	flex: 1;

	.groups-container {
		gap: 3rem;
	}

	${cssMedia.narrow} {
		.groups-container {
			gap: 2rem;
		}
	}

	.group-container {
		gap: 2.5rem;
		display: flex;
		flex-direction: column;
	}

	.group-content {
		display: grid;
	}

	.scroll-conteiner {
		scroll-margin-top: 52px;
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
