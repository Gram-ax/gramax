import resolveModule from "@app/resolveModule/frontend";
import { CatalogErrorGroups } from "@core/FileStructue/Catalog/CatalogErrorGroups";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import type { CatalogError, CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import t, { type TranslationKey } from "@ext/localization/locale/translate";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { Dialog, DialogBody, DialogContent, DialogHeaderTemplate } from "@ui-kit/Dialog";
import { Loader } from "@ui-kit/Loader";
import { ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import GoToArticle from "../../../components/Actions/GoToArticle";
import Icon from "../../../components/Atoms/Icon";
import Tooltip from "../../../components/Atoms/Tooltip";
import Breadcrumb from "../../../components/Breadcrumbs/LinksBreadcrumb";
import Code from "../../markdown/elements/code/render/component/Code";

export interface ResourceError {
	title: string;
	logicPath: string;
	editorLink: string;
	values: string[];
	isText?: boolean;
}

interface HealthcheckProps {
	itemLinks: ItemLink[];
	className?: string;
	onClose?: () => void;
}

const Healthcheck = ({ itemLinks, className, onClose }: HealthcheckProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);
	const [data, setData] = useState<CatalogErrors>(null);

	const loadData = useCallback(async () => {
		const healthcheckUrl = apiUrlCreator.getHealthcheckUrl();
		const res = await FetchService.fetch<CatalogErrors>(healthcheckUrl);
		if (!res?.ok) return;
		setData(await res?.json?.());
	}, [apiUrlCreator]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		loadData();
	}, []);

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose?.();
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent data-qa={`catalog-healthcheck-modal`} size="L">
				<DialogHeaderTemplate
					description={t("healthcheck-description")}
					icon={ShieldCheck}
					title={t("healthcheck")}
				/>
				<DialogBody className={cn(className, "article")}>
					{data ? (
						Object.values(CatalogErrorGroups).map((errorGroups) => {
							return (
								<ResourceErrorComponent
									data={data[errorGroups.type] ?? []}
									errorGroup={errorGroups}
									goToArticleOnClick={() => onOpenChange(false)}
									itemLinks={itemLinks}
									key={errorGroups.type}
								/>
							);
						})
					) : (
						<Loader size="3xl" />
					)}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};

const getIcons = (isError) =>
	isError ? (
		<Icon code="x" strokeWidth="2.5" style={{ color: "red", marginRight: "0.5rem" }} />
	) : (
		<Icon code="check" strokeWidth="2.5" style={{ color: "green", marginRight: "0.5rem" }} />
	);

interface ResourceErrorComponentProps {
	errorGroup: { type: string; title: string };
	data: CatalogError[];
	itemLinks: ItemLink[];
	goToArticleOnClick: () => void;
}

export const groupResourceErrors = (data: CatalogError[]) => {
	const resourceErrors: ResourceError[] = [];

	data.forEach((d: CatalogError) => {
		const errorLink: ResourceError = {
			title: d.args.title,
			logicPath: d.args.logicPath,
			editorLink: d.args.editorLink,
			values: [d.args.value],
			isText: d.args.isText,
		};
		const index = resourceErrors.findIndex((el) => el.logicPath === errorLink.logicPath);
		if (index === -1) {
			resourceErrors.push(errorLink);
		} else {
			resourceErrors[index].values.push(d.args.value);
		}
	});
	return resourceErrors;
};

const ResourceErrorComponent = ({ errorGroup, data, itemLinks, goToArticleOnClick }: ResourceErrorComponentProps) => {
	const resourceErrors: ResourceError[] = groupResourceErrors(data);
	const articleBreadcrumbDatas: { [logicPath: string]: { titles: string[]; links: CategoryLink[] } } = {};
	const { isTauri } = usePlatform();

	const search = (itemLinks: ItemLink[], catLinks: CategoryLink[], logicPath: string) => {
		itemLinks.forEach((link) => {
			const linkLogicPath = RouterPathProvider.getLogicPath(link.pathname);
			if (logicPath.includes(linkLogicPath)) {
				if (logicPath === linkLogicPath) {
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
				{t(`check-${errorGroup.type}` as TranslationKey)}
			</h3>
			{resourceErrors.length ? (
				<table style={{ overflow: "visible" }}>
					<thead>
						<tr>
							<th>{t("article2")}</th>
							<th className="flex">{t(errorGroup.title as TranslationKey)}</th>
						</tr>
					</thead>
					<tbody>
						{resourceErrors.map((resourceError, idx) => {
							return (
								<tr className="link" key={`${resourceError.logicPath}-${resourceError.title}-${idx}`}>
									<td>
										<div className="article-name">
											<Breadcrumb readyData={articleBreadcrumbDatas[resourceError.logicPath]} />
											<GoToArticle
												href={resourceError.logicPath}
												onClick={goToArticleOnClick}
												trigger={resourceError.title}
											/>
										</div>
									</td>
									<td className="flex">
										<div className="values-container">
											{resourceError.values.map((link) => (
												<p className="value-item" key={link}>
													{resourceError.isText ? <span>{link}</span> : <Code>{link}</Code>}
												</p>
											))}
										</div>
										<IsReadOnlyHOC>
											<div>
												<a
													// biome-ignore lint/a11y/useValidAnchor: expected
													onClick={(ev) => {
														if (isTauri) {
															ev.preventDefault();
															ev.stopPropagation();
															resolveModule("openWindowWithUrl")(
																resourceError.editorLink,
															);
														}
													}}
													target="_blank"
													{...(!isTauri && {
														href: resourceError.editorLink,
													})}
													rel="noreferrer"
												>
													<Tooltip
														content={<span>{`${t("open-in-new-window")}`}</span>}
														distance={5}
													>
														<span>
															<Icon code="external-link" isAction={true} />
														</span>
													</Tooltip>
												</a>
											</div>
										</IsReadOnlyHOC>
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

export default styled(Healthcheck)`
	padding: 1em 0.1em 1em 1em;
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

			td:first-of-type,
			th:first-of-type {
				border-right: unset;
			}
		}
	}

	.errors {
		width: 100%;

		h2, h3 {
			margin-top: 0px !important;
		}

		.values-container {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.value-item {
			line-height: 1.4;
			font-size: 0.875em;
		}

		> pre {
			margin: 0 !important;
		}
		h3 {
			margin-bottom: 0px;
			display: flex;
			align-items: center;
		}

		table {
			padding: 0 0 0.5em 1.8em;
		}
	}
`;
