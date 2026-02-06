import Divider from "@components/Atoms/Divider";
import Icon from "@components/Atoms/Icon";
import Anchor from "@components/controls/Anchor";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import openCloudModal from "@ext/static/components/openCloudModal";
import useGetCatalogCloudUrl from "@ext/static/utils/cloudUrl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { useState } from "react";

const PublishStatusPanel = ({ className }: { className?: string }) => {
	if (!CloudStateService.value) return;
	const { catalogVersion } = CloudStateService.value;
	if (!catalogVersion) return;
	const [modalOpen, setModalOpen] = useState(false);
	const url = useGetCatalogCloudUrl();

	const date = new Date(catalogVersion).toLocaleDateString();

	const openCloudModalWhenReady = () => {
		const check = () => {
			if (document.body.style.pointerEvents !== "none") openCloudModal();
			else setTimeout(check, 50);
		};
		check();
	};

	return (
		<>
			<Divider />
			<div className={classNames(className, { modalOpen })}>
				<Anchor className="anchor" data-qa="qa-clickable" href={url}>
					<ButtonLink iconCode="cloud-upload" text={t("cloud.publish-status-panel.published")} />
				</Anchor>
				<div className="right">
					<div className="date-and-trigger">
						<span className="date">{date}</span>
						<DropdownMenu onOpenChange={setModalOpen}>
							<DropdownMenuTrigger asChild>
								<ButtonLink className="trigger" iconCode="ellipsis-vertical" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={openCloudModalWhenReady}>
									<Icon code="refresh-cw"></Icon>
									<span>{t("cloud.publish-status-panel.republish")}</span>
								</DropdownMenuItem>
								<StyledDeleteButton />
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</>
	);
};

const DeleteButton = ({ className }: { className?: string }) => {
	const { cloudApi, checkCatalogVersion } = CloudStateService.value;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const onClick = async () => {
		// eslint-disable-next-line @typescript-eslint/await-thenable
		if (!(await confirm(t("cloud.delete-catalog")))) return;
		await cloudApi.deleteCatalog(catalogName);
		checkCatalogVersion();
	};

	return (
		<DropdownMenuItem className={className} onClick={onClick}>
			<Icon code="trash-2"></Icon>
			<span>{t("cloud.publish-status-panel.delete")}</span>
		</DropdownMenuItem>
	);
};

const StyledDeleteButton = styled(DeleteButton)`
	&:hover span,
	&:hover svg {
		color: red !important;
	}
`;

export default styled(PublishStatusPanel)`
	font-size: 0.75rem;
	justify-content: space-between;
	width: 100%;
	margin-top: 1em;

	&,
	.anchor,
	.right {
		display: inline-flex;
	}

	.right {
		align-items: center;
	}

	.date-and-trigger {
		display: flex;
		align-items: center;
	}

	.date {
		margin-right: -1em;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.trigger {
		opacity: 0;
		transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		i {
			width: unset;
		}
	}

	:hover,
	&.modalOpen {
		.date {
			transform: translateX(-1em);
		}
		.trigger {
			opacity: 1;
		}
	}
`;
