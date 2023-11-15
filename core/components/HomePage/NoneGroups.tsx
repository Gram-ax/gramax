import styled from "@emotion/styled";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Clone from "../../extensions/git/actions/Clone/components/Clone";
import useLocalize from "../../extensions/localization/useLocalize";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Button from "../Atoms/Button/Button";
import Icon from "../Atoms/Icon";
import ModalLayoutLight from "../Layouts/ModalLayoutLight";

const NoneGroups = styled(
	({ className, isLogged, isReadOnly }: { className?: string; isLogged: boolean; isReadOnly: boolean }) => {
		return (
			<div className={className}>
				<div>
					<ModalLayoutLight>
						<h2>{useLocalize("soFarItsEmpty")}</h2>
						{((isLogged && isReadOnly) || !isReadOnly) && (
							<>
								<p>{useLocalize("addCatalogToGetStarted")}</p>
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
												<Icon code="cloud" faFw />
												<span>{`${useLocalize("load")} ${useLocalize("existing")}`}</span>
											</Button>
										}
									/>
								</div>
							</>
						)}
					</ModalLayoutLight>
				</div>
			</div>
		);
	},
)`
	flex: 1;
	display: flex;
	align-items: center;
	flex-direction: column;
	> div {
		width: 60%;
		margin: auto;
		height: 55%;

		> div {
			padding: 1rem;
			display: flex;
			align-items: flex-start;

			> h2 {
				margin-top: 0 !important;
				${(p) => !p.isLogged && p.isReadOnly && "margin-bottom: 0 !important"}
			}

			.buttons {
				gap: 2rem;
				width: 100%;
				display: flex;
				margin-top: 1.5rem;
				flex-direction: row;
				justify-content: space-evenly;

				> div {
					flex: 0.5;

					> div {
						width: 100%;
						justify-content: center;
					}
				}
			}
		}
	}
`;

export default NoneGroups;
