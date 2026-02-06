import Skeleton from "@components/Atoms/Skeleton";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import TextArea from "@components/Atoms/TextArea";
import Path from "@core/FileProvider/Path/Path";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import TiptapGramaxAi from "@ext/ai/logic/TiptapGramaxAi";
import t from "@ext/localization/locale/translate";
import MenuButton from "@ext/markdown/core/edit/components/Menu/Button";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { CSSProperties, MouseEvent, useEffect, useState } from "react";

const EditableArea = ({
	defaultValue,
	onChange,
	style,
}: {
	defaultValue: string;
	onChange: (value: string) => void;
	style?: CSSProperties;
}) => {
	const [value, setValue] = useState(defaultValue);

	const onChangeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setValue(e.target.value);
		onChange(e.target.value);
	};

	return <TextArea onChange={onChangeHandler} style={style} value={value} />;
};

const Attention = styled.div<{ hasText: boolean }>`
	padding-top: ${({ hasText }) => (hasText ? "10px" : "0")};
`;

const CopyButton = ({ text }: { text: string }) => {
	const [isCopied, setIsCopied] = useState(false);
	if (!navigator || !navigator.clipboard) return null;

	const onClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		navigator.clipboard.writeText(text);
		setIsCopied(true);
	};

	const onMouseLeave = () => {
		setIsCopied(false);
	};

	return (
		<Button onClick={onClick} onMouseLeave={onMouseLeave} variant="outline">
			{isCopied ? t("copied") : t("copy")}
		</Button>
	);
};

const SkeletonWrapper = styled.div`
	position: relative;
	width: 100%;
	min-height: 4em;
`;

const FileTranscription = ({ path }: { path: Path }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const editor = EditorService.getEditor();

	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [text, setText] = useState(null);

	useWatch(() => {
		setText(null);
		setIsLoading(true);
	}, [path]);

	const transcribe = async () => {
		try {
			const res = await FetchService.fetch(apiUrlCreator.getArticleResource(path.value, null));
			if (!res.ok) return;
			const file = await res.arrayBuffer();

			const ai = new TiptapGramaxAi(apiUrlCreator, editor.schema);
			const text = await ai.transcribe(file);
			setText(text);
		} catch (e) {
			console.error(e);
		}

		setIsLoading(false);
	};

	const onClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		setIsLoading(true);
		transcribe();
	};

	useEffect(() => {
		if (open) transcribe();
	}, [open]);

	return (
		<Modal onOpenChange={setOpen} open={open}>
			<ModalTrigger asChild>
				<MenuButton icon="audio-lines" tooltipText={t("ai.transcribe.name")} />
			</ModalTrigger>
			<ModalContent>
				<form className="contents ui-kit">
					<FormHeader
						description={t("ai.transcribe.description")}
						icon="audio-lines"
						title={t("ai.transcribe.name")}
					/>
					<Divider />
					<ModalBody>
						<div className="article" style={{ background: "initial" }}>
							<SkeletonWrapper>
								{isLoading && (
									<Skeleton
										style={{ width: "100%", position: "absolute", top: 0, left: 0, height: "100%" }}
									/>
								)}
								{!isLoading && (
									<EditableArea
										defaultValue={text}
										onChange={setText}
										style={{ opacity: isLoading ? 0 : 1, minHeight: "5em" }}
									/>
								)}
							</SkeletonWrapper>
							<Attention
								dangerouslySetInnerHTML={{ __html: t("ai.transcribe.modalAttention") }}
								hasText={text?.length >= 0}
							/>
						</div>
					</ModalBody>
					<FormFooter
						primaryButton={
							isLoading && (
								<Button disabled hidden onClick={onClick} variant="outline">
									{isLoading ? t("ai.transcribtion") : t("ai.transcribe.name")}
									{isLoading && <SpinnerLoader height={16} width={16} />}
								</Button>
							)
						}
						secondaryButton={text && <CopyButton text={text} />}
					/>
				</form>
			</ModalContent>
		</Modal>
	);
};

export default FileTranscription;
