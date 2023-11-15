import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import GoToArticle from "../../../components/Actions/GoToArticle";
import ApiNoData from "../../../components/ApiNoData";
import Icon from "../../../components/Atoms/Icon";
import Tooltip from "../../../components/Atoms/Tooltip";
import Breadcrumb from "../../../components/Breadcrumbs/ArticleBreadcrumb";
import ModalLayout from "../../../components/Layouts/Modal";
import { CatalogError, CatalogErrors } from "../../../logic/FileStructue/Catalog/Catalog";
import { CatalogErrorGroups } from "../../../logic/FileStructue/Catalog/CatalogErrorGroups";
import useLocalize from "../../localization/useLocalize";
import Code from "../../markdown/elements/code/render/component/Code";
import { CategoryLink, ItemLink } from "../../navigation/NavigationLinks";

interface ResourceError {
	title: string;
	logicPath: string;
	editorLink: string;
	resourcePath: string[];
}

const Healthcheck = styled(({ itemLinks, className }: { itemLinks: ItemLink[]; className?: string }) => {
	const isLogged = PageDataContextService.value.isLogged;
	const catalogProps = CatalogPropsService.value;
	if (!isLogged || catalogProps.readOnly) return null;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(false);
	const [getData, setGetData] = useState(false);
	const [saveData, setSaveData] = useState<CatalogErrors>(null);

	const healthcheckUrl = apiUrlCreator.getHealthcheckUrl();
	const { data, error } = UseSWRService.getData<CatalogErrors>(healthcheckUrl, Fetcher.json, getData);

	useEffect(() => {
		if (!data) return;
		setSaveData(data);
		setGetData(false);
	});

	return (
		<ModalLayout
			isOpen={isOpen}
			trigger={
				<a>
					<Icon code="heart-pulse" faFw={true} />
					<span>{useLocalize("healthcheck")}</span>
				</a>
			}
			onClose={() => {
				setIsOpen(false);
			}}
			onOpen={() => {
				setIsOpen(true);
				setGetData(true);
			}}
			setGlobasStyles={true}
			contentWidth="60%"
		>
			<div className={`${className} modal article  block-elevation-2`} data-qa={`catalog-healthcheck-modal`}>
				<h2>{useLocalize("healthcheck")}</h2>
				{saveData ? (
					Object.values(CatalogErrorGroups).map((value, key) => {
						return (
							<ResourceErrorComponent
								key={key}
								title={useLocalize(("check" + value) as any)}
								data={saveData?.[value] ?? []}
								itemLinks={itemLinks}
								goToArticleOnClick={() => setIsOpen(false)}
							/>
						);
					})
				) : (
					<ApiNoData error={error} />
				)}
			</div>
		</ModalLayout>
	);
})`
	padding: 1rem;
	overflow: auto;
	max-height: 100%;
	transition: all 0.3s;

	h2 {
		width: 100%;
	}

	.article-name {
		height: 100%;
		display: flex;
		font-size: 14px;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: var(--distance-i-span);

		.breadcrumb {
			line-height: 100%;
			margin-top: 0 !important;
		}

		> a {
			line-height: 100%;
			color: var(--color-primary-general);
		}
		> a:hover {
			color: var(--color-primary);
		}
	}

	td:last-child > a {
		height: 100%;
		display: flex;
		align-items: center;
	}

	tbody,
	thead {
		display: flex;
		flex-direction: column;

		> tr {
			display: flex;

			> th {
				font-weight: 400;
			}

			> th:first-of-type,
			> td:first-of-type {
				flex: 0.6;
			}

			> th.flex,
			> td.flex {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;

				> div:last-child {
					visibility: hidden;
				}
			}

			> th:last-child,
			> td:last-child {
				width: 24px;
			}
		}

		> tr:hover > td.flex > div:last-child {
			visibility: visible !important;
		}
	}

	.errors {
		width: 100%;

		> pre {
			margin: 0 !important;
		}
	}
`;

const getIcons = (isError) =>
	isError ? (
		<Icon code="xmark" style={{ fontWeight: 600, color: "red", fontSize: "20px", marginRight: "0.5rem" }} />
	) : (
		<Icon code="check" style={{ fontWeight: 900, color: "green", marginRight: "0.5rem" }} />
	);

const ResourceErrorComponent = ({
	title,
	data,
	itemLinks,
	goToArticleOnClick,
}: {
	title: string;
	data: CatalogError[];
	itemLinks: ItemLink[];
	goToArticleOnClick: () => void;
}) => {
	const IsServerApp = PageDataContextService.value.conf.isServerApp;

	const resourceErrors: ResourceError[] = [];
	const articleBreadcrumbDatas: { [logicPath: string]: { titles: string[]; links: CategoryLink[] } } = {};

	data.forEach((d: CatalogError) => {
		const errorLink: ResourceError = {
			title: d.args.title,
			logicPath: d.args.logicPath,
			editorLink: d.args.editorLink,
			resourcePath: [d.args.linkTo],
		};
		const index = resourceErrors.findIndex((el) => el.logicPath === errorLink.logicPath);
		if (index == -1) {
			resourceErrors.push(errorLink);
		} else {
			resourceErrors[index].resourcePath.push(d.args.linkTo);
		}
	});

	const search = (itemLinks: ItemLink[], catLinks: CategoryLink[], logicPath: string) => {
		itemLinks.forEach((link) => {
			if (logicPath.includes(link.pathname)) {
				if (!(link as CategoryLink).items) {
					articleBreadcrumbDatas[logicPath] = {
						titles: catLinks.map((l) => l.title),
						links: catLinks,
					};
				} else search((link as CategoryLink).items, [...catLinks, link as CategoryLink], logicPath);
			}
		});
	};
	resourceErrors.forEach((d) => {
		search(itemLinks, [], d.logicPath);
	});

	return (
		<div className="errors">
			<h3 style={{ marginBottom: 0 }}>
				{getIcons(data.length)}
				{title}
			</h3>
			{resourceErrors.length ? (
				<table style={{ overflow: "visible" }}>
					<thead>
						<tr>
							<th>{useLocalize("article2")}</th>
							<th className="flex">{useLocalize("incorrectsPaths")}</th>
						</tr>
					</thead>
					<tbody>
						{resourceErrors.map((resourceError, idx) => {
							return (
								<tr key={idx} className="link">
									<td>
										<div className="article-name">
											<Breadcrumb readyData={articleBreadcrumbDatas[resourceError.logicPath]} />
											<GoToArticle
												trigger={resourceError.title}
												href={resourceError.logicPath}
												onClick={goToArticleOnClick}
											/>
										</div>
									</td>
									<td className="flex">
										<div>
											{resourceError.resourcePath.map((link) => (
												<>
													<Code>{link}</Code>
													<br />
												</>
											))}
										</div>
										<div>
											<a target="_blank" href={resourceError.editorLink} rel="noreferrer">
												<Tooltip
													distance={5}
													content={
														<span>
															{IsServerApp
																? useLocalize("editOnGitLab")
																: useLocalize("editOnVSCode")}
														</span>
													}
												>
													<span>
														<Icon code="pencil-alt" isAction={true} />
													</span>
												</Tooltip>
											</a>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			) : null}
		</div>
	);
};

export default Healthcheck;
