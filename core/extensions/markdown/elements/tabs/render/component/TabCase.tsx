import ContentEditable from "@components/Atoms/ContentEditable";
import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface TabCaseProps {
	idx: number;
	name: string;
	key?: number;
	icon?: string;
	isEdit?: boolean;
	onClick?: (idx: number) => void;
	activeIdx?: number;
	totalTabs?: number;
	className?: string;
	onTabEnter?: (idx: number) => void;
	onNameUpdate?: (value: string, idx: number) => void;
	onRemoveClick?: (idx: number) => void;
}

const TabCase = (props: TabCaseProps) => {
	const {
		className,
		name,
		icon,
		idx,
		activeIdx,
		isEdit,
		totalTabs,
		onTabEnter,
		onNameUpdate,
		onRemoveClick,
		onClick,
		key = idx,
	} = props;

	return (
		<div
			className={classNames("case", { active: activeIdx == idx }, [className, idx.toString()])}
			key={idx}
			onClick={() => onClick(idx)}
		>
			{icon && <Icon code={icon} style={{ marginRight: "0.2em" }} />}
			{isEdit ? (
				<ContentEditable
					className="text"
					deps={[totalTabs]}
					onChange={(v) => onNameUpdate(v, idx)}
					onEnter={() => onTabEnter(idx)}
					value={name}
				/>
			) : (
				<span className="read text" title={name}>
					{name}
				</span>
			)}
			{isEdit && (
				<Tooltip>
					<TooltipTrigger asChild>
						<IconButton
							className="tabs-action w-4 h-4"
							data-qa="qa-del-tab"
							icon="x"
							key={key}
							onClick={(e) => {
								onRemoveClick(idx);
								onClick(0);
								e.stopPropagation();
							}}
							size="lg"
							style={{ padding: "0", height: "auto" }}
							variant="text"
						/>
					</TooltipTrigger>
					<TooltipContent>
						{totalTabs == 1 ? t("editor.tabs.delete-last") : t("editor.tabs.delete")}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};

export default styled(TabCase)`
	gap: 0.1rem;
	display: flex;
	max-height: 34px;
	font-weight: 400;
	align-items: center;
	cursor: ${(p) => (p.isEdit ? "text" : "pointer")};
	max-width: ${(p) => `${100 / p.totalTabs}%`};

	.read {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap !important;
		flex: 1;
	}

	.text {
		border-bottom: 2px #ffffff0f solid;
	}

	.tabs-action {
		flex-shrink: 0;
		visibility: hidden;
	}

	&:hover {
		.text {
			border-bottom: var(--color-text-secondary) solid 2px;
		}

		.tabs-action {
			visibility: ${(p) => (p.isEdit ? "visible" : "hidden")};
		}
	}

	&.active {
		.text {
			border-bottom: var(--color-article-text) solid 2px;
		}
	}
`;
