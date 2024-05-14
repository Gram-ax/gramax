import Welcome from "@components/Welcome";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import styled from "@emotion/styled";
import { type HTMLAttributes } from "react";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Clone from "../../extensions/git/actions/Clone/components/Clone";
import useLocalize from "../../extensions/localization/useLocalize";
import Button from "../Atoms/Button/Button";
import Icon from "../Atoms/Icon";

const NoneGroups = (props: HTMLAttributes<HTMLDivElement>) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	return (
		<div {...props}>
			<Welcome
				title={useLocalize("soFarItsEmpty")}
				body={
					isReadOnly ? (
						<p>{useLocalize("addCatalogToGetStartedDocportal")}</p>
					) : (
						<>
							<p>{useLocalize("addCatalogToGetStarted")}</p>
							<div
								dangerouslySetInnerHTML={{
									__html: useLocalize("addCatalogOptions"),
								}}
							/>
						</>
					)
				}
				actions={
					<>
						<IsReadOnlyHOC>
							<CreateCatalog
								trigger={
									<Button>
										<Icon code="plus" viewBox="3 3 18 18"/>
										<span>{useLocalize("createNew")}</span>
									</Button>
								}
							/>
						</IsReadOnlyHOC>
						<Clone
							trigger={
								<Button>
									<Icon code="cloud-download" />
									<span>
										{`${useLocalize("load")}`}
										<IsReadOnlyHOC>{` ${useLocalize("existing")}`}</IsReadOnlyHOC>
									</span>
								</Button>
							}
						/>
					</>
				}
			/>
		</div>
	);
};

export const NoneGroupsStyled = styled(NoneGroups)`
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
