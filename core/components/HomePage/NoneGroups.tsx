import resolveModule from "@app/resolveModule/frontend";
import Welcome from "@components/Welcome";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { type HTMLAttributes } from "react";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Clone from "../../extensions/git/actions/Clone/components/Clone";
import Button from "../Atoms/Button/Button";
import Icon from "../Atoms/Icon";

const NoneGroups = (props: HTMLAttributes<HTMLDivElement>) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const hasWorkspace = !!PageDataContextService.value.workspace.current;

	return (
		<div {...props}>
			<Welcome
				title={t("so-far-its-empty")}
				body={
					isReadOnly ? (
						<p>{t("catalog.get-started.docportal")}</p>
					) : (
						<>
							<p>{t("catalog.get-started.editor")}</p>
							<div
								dangerouslySetInnerHTML={{
									__html: t("catalog.get-started.editor-desc"),
								}}
							/>
							{!hasWorkspace && (
								<p>
									<span>{t("workspace.selected")}</span>
									<code>{PageDataContextService.value.workspace.defaultPath}</code>
									<span>
										&nbsp;
										<a
											href="#"
											onClick={async () => {
												const path = await resolveModule("openDirectory")();
												if (!path) return;
												await FetchService.fetch(apiUrlCreator.setDefaultPath(path));
												await refreshPage();
											}}
										>
											{t("edit3")}
										</a>
									</span>
								</p>
							)}
						</>
					)
				}
				actions={
					<>
						<IsReadOnlyHOC>
							<CreateCatalog
								trigger={
									<Button>
										<Icon code="plus" viewBox="3 3 18 18" />
										<span>{t("catalog.new")}</span>
									</Button>
								}
							/>
						</IsReadOnlyHOC>
						<Clone
							trigger={
								<Button>
									<Icon code="cloud-download" />
									<span>{`${t("catalog.clone")}`}</span>
								</Button>
							}
							forClone={true}
						/>
						<IsReadOnlyHOC>
							<Clone
								trigger={
									<Button>
										<Icon code="import" />
										<span>{`${t("catalog.import")}`}</span>
									</Button>
								}
								forClone={false}
							/>
						</IsReadOnlyHOC>
					</>
				}
			/>
		</div>
	);
};

export const NoneGroupsStyled = styled(NoneGroups)`
	margin: auto 0;
	height: inherit;
	width: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
`;
// `
// flex: 1;
// display: flex;
// align-items: center;
// flex-direction: column;

// 	> div {
// 		width: 45rem;
// 		margin: auto;

// 		> div {
// 			padding: 2rem;
// 			display: flex;
// 			align-items: flex-start;

// 			h2 {
// 				margin-top: 0 !important;
// 				${(p) => !p.isLogged && p.isReadOnly && "margin-bottom: 0 !important"}
// 			}

// 			.buttons {
// 				gap: 2rem;
// 				width: 100%;
// 				display: flex;
// 				margin-top: 0.5rem;
// 				flex-direction: row;
// 				justify-content: space-evenly;

// 				> div {
// 					flex: 0.5;

// 					> div,
// 					> div > div {
// 						width: 100%;
// 						justify-content: center;
// 					}
// 				}
// 			}
// 		}
// 	}

// ${cssMedia.medium} {
// 	> div {
// 		width: 100%;
// 	}
// }
// `;

export default NoneGroupsStyled;
