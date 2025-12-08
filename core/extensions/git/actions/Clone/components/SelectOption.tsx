import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { STORAGE_GET_ICON } from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	isInDropdown,
} from "@ui-kit/Dropdown";
import { Indicator } from "@ui-kit/Indicator";
import { MenuItem, MenuItemIcon, MenuItemIconButton, MenuItemText } from "@ui-kit/MenuItem";
import { SelectItemIndicator, SelectItemText, SelectOption } from "@ui-kit/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { PointerEvent, useCallback, useState } from "react";

interface CustomSelectOptionProps {
	value: string;
	label: string;
	icon: string;
	invalid?: boolean;
	onEdit?: (e: PointerEvent<HTMLDivElement>) => void;
	onDelete?: (e: PointerEvent<HTMLDivElement>) => void;
	onClickInvalid?: (e: PointerEvent<HTMLDivElement>) => void;
}

const IconWrapper = styled.span`
	.${STORAGE_GET_ICON[SourceType.gitea]}, .${STORAGE_GET_ICON[SourceType.gitVerse]} {
		svg {
			fill: hsl(var(--primary-fg));
		}
	}
`;

const CustomSelectOption = (props: CustomSelectOptionProps) => {
	const { value, label, icon, onDelete, onEdit, invalid, onClickInvalid } = props;
	const [open, setOpen] = useState(false);

	const onEditHandler = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			e.stopPropagation();
			e.preventDefault();
			onEdit?.(e);
			setOpen(false);
		},
		[onEdit],
	);

	const onDeleteHandler = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			e.stopPropagation();
			e.preventDefault();
			onDelete?.(e);
			setOpen(false);
		},
		[onDelete],
	);

	const onInvalidHandler = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			if (!invalid || isInDropdown(e)) return;
			setOpen(false);
			e.stopPropagation();
			e.preventDefault();
			onClickInvalid?.(e);
		},
		[invalid, onClickInvalid],
	);

	return (
		<SelectOption value={value} asChild onPointerDown={onInvalidHandler}>
			<MenuItem className="pl-8 lg:pl-8">
				<SelectItemIndicator asChild>
					<Icon code="check" className="absolute left-2" />
				</SelectItemIndicator>
				<SelectItemText asChild>
					<IconWrapper className="flex flex-row items-center gap-2 p-0">
						<span className={classNames("relative", {}, [icon])}>
							{invalid && (
								<Tooltip>
									<TooltipContent>{t("git.source.error.invalid-credentials2")}</TooltipContent>
									<TooltipTrigger asChild>
										<Indicator
											rounded
											size="sm"
											className="bg-status-error"
											style={{
												position: "absolute",
												top: "0",
												right: "0",
												transform: "translate(50%, -50%)",
											}}
										/>
									</TooltipTrigger>
								</Tooltip>
							)}
							<MenuItemIcon icon={icon} />
						</span>
						<MenuItemText>{label}</MenuItemText>
					</IconWrapper>
				</SelectItemText>
				{(onDelete || onEdit) && (
					<DropdownMenu open={open} onOpenChange={setOpen}>
						<DropdownMenuTrigger className="ml-auto">
							<MenuItemIconButton
								icon="ellipsis-vertical"
								data-qa="option-menu"
								className="ml-auto right-extensions"
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{onEdit && (
								<DropdownMenuItem onPointerDown={onEditHandler}>
									<Icon code="pencil" />
									{t("edit2")}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<DropdownMenuItem type="danger" onPointerDown={onDeleteHandler}>
									<Icon code="trash" />
									{t("delete")}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</MenuItem>
		</SelectOption>
	);
};

export default CustomSelectOption;
