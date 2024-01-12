import FormStyle from "@components/Form/FormStyle";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import styled from "@emotion/styled";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Clone from "../../extensions/git/actions/Clone/components/Clone";
import useLocalize from "../../extensions/localization/useLocalize";
import { cssMedia } from "../../ui-logic/utils/cssUtils";
import Button from "../Atoms/Button/Button";
import Icon from "../Atoms/Icon";
import ModalLayoutLight from "../Layouts/ModalLayoutLight";

const NoneGroups = styled(
	({ isLogged, className }: { className?: string; isLogged?: boolean; isReadOnly?: boolean }) => {
		return (
			<div className={className}>
				<ModalLayoutLight>
					<FormStyle>
						<>
							<h2>{useLocalize("soFarItsEmpty")}</h2>
							{isLogged && (
								<>
									<p>{useLocalize("addCatalogToGetStarted")}</p>
									<div
										dangerouslySetInnerHTML={{
											__html: useLocalize("addCatalogOptions"),
										}}
									/>
									<div className="buttons">
										<IsReadOnlyHOC>
											<CreateCatalog
												trigger={
													<Button>
														<Icon code="plus" faFw />
														<span>{useLocalize("createNew")}</span>
													</Button>
												}
											/>
										</IsReadOnlyHOC>
										<Clone
											trigger={
												<Button>
													<Icon code="cloud-arrow-down" faFw />
													<span>{`${useLocalize("load")} ${useLocalize("existing")}`}</span>
												</Button>
											}
										/>
									</div>
								</>
							)}
						</>
					</FormStyle>
				</ModalLayoutLight>
			</div>
		);
	},
)`
	flex: 1;
	display: flex;
	align-items: center;
	flex-direction: column;

	> div {
		width: 45rem;
		margin: auto;

		ul {
			margin-block-start: 0;
		}

		> div {
			padding: 1rem;
			display: flex;
			align-items: flex-start;

			h2 {
				margin-top: 0 !important;
				${(p) => !p.isLogged && p.isReadOnly && "margin-bottom: 0 !important"}
			}

			.buttons {
				gap: 2rem;
				width: 100%;
				display: flex;
				margin-top: 0.5rem;
				flex-direction: row;
				justify-content: space-evenly;

				> div {
					flex: 0.5;

					> div,
					> div > div {
						width: 100%;
						justify-content: center;
					}
				}
			}
		}
	}

	${cssMedia.medium} {
		> div {
			width: 100%;
		}
	}
`;

export default NoneGroups;
