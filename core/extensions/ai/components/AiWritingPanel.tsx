import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import { useState, useRef, KeyboardEvent } from "react";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import t from "@ext/localization/locale/translate";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Tooltip from "@components/Atoms/Tooltip";
import { Instance, Props } from "tippy.js";
import { ProviderItemProps } from "@ext/articleProvider/models/types";

interface AiWritingPanelProps {
	placeholder: string;
	onSubmit: (command: string) => void;
	closeHandler?: () => void;
}

interface PromptListProps {
	children: JSX.Element;
	onClick: (command: string) => void;
}

const StyledInput = styled(Input)`
	min-width: 25em;
`;

const Loader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 1.5em;
	font-size: 0.8em;
	color: var(--color-tooltip-text);

	.button {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		height: 100%;
	}
`;

const TooltipContentWrapper = styled.div`
	padding: 4px;
	color: var(--color-tooltip-text);
	border-radius: var(--radius-large);
	background: var(--color-tooltip-background);
	max-height: 20em;
	overflow-y: auto;
`;

const PromptList = ({ onClick, children }: PromptListProps) => {
	const [list, setList] = useState<ProviderItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState<boolean>(false);
	const instanceRef = useRef<Instance<Props>>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchTemplateItems = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticleListInGramaxDir("prompt");
		const res = await FetchService.fetch<ProviderItemProps[]>(url);

		if (!res.ok) return setIsApiRequest(false);
		const prompts = await res.json();

		setList(prompts);
		setIsApiRequest(false);
	};

	return (
		<Tooltip
			onMount={(instance) => {
				instanceRef.current = instance;
			}}
			place="top-start"
			appendTo="parent"
			visible
			onHide={() => {
				setList([]);
			}}
			onShow={(props) => {
				props.popper.style.width = "22.25em";
				fetchTemplateItems();
			}}
			arrow={false}
			hideOnClick={undefined}
			distance={8}
			hideInMobile={false}
			customStyle
			interactive
			content={
				list.length || isApiRequest ? (
					<TooltipContentWrapper>
						{isApiRequest ? (
							<>
								{[...Array(3)].map((_, index) => (
									<Loader key={index}>
										<span>{t("loading")}</span>
										<SpinnerLoader width={14} height={14} />
									</Loader>
								))}
							</>
						) : (
							list.map((item) => {
								return (
									<Button key={item.id} onClick={() => onClick(item.id)}>
										<div className="iconFrame">
											<span>{item.title.length ? item.title : t("article.no-name")}</span>
										</div>
									</Button>
								);
							})
						)}
					</TooltipContentWrapper>
				) : (
					<></>
				)
			}
		>
			{children}
		</Tooltip>
	);
};

const AiWritingPanel = ({ closeHandler, onSubmit, placeholder }: AiWritingPanelProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const onClickPrettiffy = (command: string) => {
		onSubmit(command);
		closeHandler?.();
	};

	const onClickSend = () => {
		if (!inputRef.current) return;
		onClickPrettiffy(inputRef.current.value);
	};

	const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onClickSend();
		}
	};

	return (
		<PromptList onClick={onClickPrettiffy}>
			<ButtonsLayout>
				<StyledInput autoFocus ref={inputRef} placeholder={placeholder} onKeyDown={onEnter} />
				<Button icon="send" tooltipText={t("send")} onClick={onClickSend} />
			</ButtonsLayout>
		</PromptList>
	);
};

export default AiWritingPanel;
