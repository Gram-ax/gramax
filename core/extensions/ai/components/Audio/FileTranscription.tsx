import Skeleton from "@components/Atoms/Skeleton";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import TextArea from "@components/Atoms/TextArea";
import type Path from "@core/FileProvider/Path/Path";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import { cn } from "@core-ui/utils/cn";
import TiptapGramaxAi from "@ext/ai/logic/TiptapGramaxAi";
import t from "@ext/localization/locale/translate";
import MenuButton from "@ext/markdown/core/edit/components/Menu/Button";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogTrigger } from "@ui-kit/Dialog";
import { Divider } from "@ui-kit/Divider";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { type CSSProperties, type MouseEvent, useCallback, useEffect, useState } from "react";

interface EditableAreaProps {
	defaultValue: string;
	onChange: (value: string) => void;
	style?: CSSProperties;
}

const EditableArea = ({ defaultValue, onChange, style }: EditableAreaProps) => {
	const [value, setValue] = useState(defaultValue);

	const onChangeHandler = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setValue(e.target.value);
			onChange(e.target.value);
		},
		[onChange],
	);

	return <TextArea onChange={onChangeHandler} style={style} value={value} />;
};

const CopyButton = ({ text }: { text: string }) => {
	const [isCopied, setIsCopied] = useState(false);
	if (!navigator || !navigator.clipboard) return null;

	const onClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		void tryCopyToClipboard(text, { showPopover: false }).then((copied) => copied && setIsCopied(true));
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

const FileTranscription = ({ path }: { path: Path }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const editor = getEditorStore().editor;

	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [text, setText] = useState(null);

	useWatch(() => {
		setText(null);
		setIsLoading(true);
	}, [path]);

	const transcribe = useCallback(async () => {
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
	}, [apiUrlCreator, path, editor.schema]);

	const onClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setIsLoading(true);
			void transcribe();
		},
		[transcribe],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (open) void transcribe();
	}, [open]);

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<MenuButton icon="audio-lines" tooltipText={t("ai.transcribe.name")} />
			</DialogTrigger>
			<DialogContent>
				<form className="contents ui-kit">
					<FormHeader
						description={t("ai.transcribe.description")}
						icon="audio-lines"
						title={t("ai.transcribe.name")}
					/>
					<Divider />
					<DialogBody>
						<div className="article" style={{ background: "initial" }}>
							<div className="relative w-full min-h-16">
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
							</div>
							<div
								className={cn("pt-2", text?.length >= 0 && "pt-0")}
								// biome-ignore lint/style/useNamingConvention: expected
								dangerouslySetInnerHTML={{ __html: t("ai.transcribe.modalAttention") }}
							/>
						</div>
					</DialogBody>
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
			</DialogContent>
		</Dialog>
	);
};

export default FileTranscription;
