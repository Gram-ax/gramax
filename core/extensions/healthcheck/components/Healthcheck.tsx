import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { CatalogErrorGroups } from "@core/FileStructue/Catalog/CatalogErrorGroups";
import styled from "@emotion/styled";
import { CatalogError, CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import t from "@ext/localization/locale/translate";
import { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { useState, Fragment } from "react";
import GoToArticle from "../../../components/Actions/GoToArticle";
import Icon from "../../../components/Atoms/Icon";
import Tooltip from "../../../components/Atoms/Tooltip";
import Breadcrumb from "../../../components/Breadcrumbs/ArticleBreadcrumb";
import ModalLayout from "../../../components/Layouts/Modal";
import Code from "../../markdown/elements/code/render/component/Code";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";

interface ResourceError {
	title: string;
	logicPath: string;
	editorLink: string;
	values: string[];
}

const Healthcheck = styled(
	({ itemLinks, className, trigger }: { itemLinks: ItemLink[]; className?: string; trigger: JSX.Element }) => {
		const isLogged = PageDataContextService.value.isLogged;
		const catalogProps = CatalogPropsService.value;
		if (!isLogged || catalogProps.readOnly) return null;

		const apiUrlCreator = ApiUrlCreatorService.value;
		const [isOpen, setIsOpen] = useState(false);
		const [data, setData] = useState<CatalogErrors>(null);

		const loadData = async () => {
			const healthcheckUrl = apiUrlCreator.getHealthcheckUrl();
			const res = await FetchService.fetch<CatalogErrors>(healthcheckUrl);
			if (!res?.ok) return;
			setData(await res?.json?.());
		};

		return (
			<ModalLayout
				contentWidth="M"
				isOpen={isOpen}
				trigger={trigger}
				onClose={() => {
					setIsOpen(false);
				}}
				onOpen={() => {
					loadData();
					setIsOpen(true);
				}}
				setGlobalsStyles={true}
			>
				<div className={`${className} modal article  block-elevation-2`} data-qa={`catalog-healthcheck-modal`}>
					<h2>{t("healthcheck")}</h2>
					{data ? (
						Object.values(CatalogErrorGroups).map((errorGroups, key) => {
							return (
								<ResourceErrorComponent
									key={key}
									errorGroup={errorGroups}
									data={data[errorGroups.type] ?? []}
									itemLinks={itemLinks}
									goToArticleOnClick={() => setIsOpen(false)}
								/>
							);
						})
					) : (
						<SpinnerLoader fullScreen />
					)}
				</div>
			</ModalLayout>
		);
	},
)`
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
			max-width: 100%;
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
				max-width: 37.5%;
				min-width: 37.5%;
			}

			> th.flex,
			> td.flex {
				width: 62.5%;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
		}
	}

	.errors {
		width: 100%;

		> pre {
			margin: 0 !important;
		}
		h3 {
			margin-bottom: 0px;
			display: flex;
			align-items: center;
		}
	}
`;

const getIcons = (isError) =>
	isError ? (
		<Icon code="x" style={{ color: "red", marginRight: "0.5rem" }} strokeWidth="2.5" />
	) : (
		<Icon code="check" style={{ color: "green", marginRight: "0.5rem" }} strokeWidth="2.5" />
	);

const ResourceErrorComponent = ({
	errorGroup,
	data,
	itemLinks,
	goToArticleOnClick,
}: {
	errorGroup: { type: string; title: string };
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
			values: [d.args.value],
		};
		const index = resourceErrors.findIndex((el) => el.logicPath === errorLink.logicPath);
		if (index == -1) {
			resourceErrors.push(errorLink);
		} else {
			resourceErrors[index].values.push(d.args.value);
		}
	});

	const search = (itemLinks: ItemLink[], catLinks: CategoryLink[], logicPath: string) => {
		itemLinks.forEach((link) => {
			const linkLogicPath = RouterPathProvider.getLogicPath(link.pathname);
			if (logicPath.includes(linkLogicPath)) {
				if (logicPath == linkLogicPath) {
					articleBreadcrumbDatas[logicPath] = {
						titles: catLinks.map((l) => l.title),
						links: catLinks,
					};
				} else
					(link as CategoryLink).items &&
						search((link as CategoryLink).items, [...catLinks, link as CategoryLink], logicPath);
			}
		});
	};
	resourceErrors.forEach((d) => {
		search(itemLinks, [], d.logicPath);
	});

	return (
		<div className="errors">
			<h3>
				{getIcons(data.length)}
				{t(("check-" + errorGroup.type) as any)}
			</h3>
			{resourceErrors.length ? (
				<table style={{ overflow: "visible" }}>
					<thead>
						<tr>
							<th>{t("article2")}</th>
							<th className="flex">{t(errorGroup.title as any)}</th>
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
											{resourceError.values.map((link) => (
												<Fragment key={link}>
													<Code>{link}</Code>
													<br />
												</Fragment>
											))}
										</div>
										{IsServerApp && (
											<div>
												<a target="_blank" href={resourceError.editorLink} rel="noreferrer">
													<Tooltip
														distance={5}
														content={<span>{`${t("edit-on")} Gramax`}</span>}
													>
														<span>
															<Icon code="pencil" isAction={true} />
														</span>
													</Tooltip>
												</a>
											</div>
										)}
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
