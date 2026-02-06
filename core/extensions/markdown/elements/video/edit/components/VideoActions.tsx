import ActionButton from "@components/controls/HoverController/ActionButton";
import ActionInput from "@components/controls/HoverController/ActionInput";
import toggleSignature from "@core-ui/toggleSignature";
import t from "@ext/localization/locale/translate";
import { Node } from "@tiptap/pm/model";
import { ChangeEvent, Dispatch, ReactElement, RefObject, SetStateAction } from "react";

interface VideoActionsProps {
	signatureRef: RefObject<HTMLInputElement>;
	updateAttributes: (attrs: Record<string, string>) => void;
	node: Node;
	setHasSignature: Dispatch<SetStateAction<boolean>>;
}

const VideoActions = (props: VideoActionsProps): ReactElement => {
	const { node, setHasSignature, signatureRef, updateAttributes } = props;

	const addSignature = () => {
		setHasSignature((prev) => toggleSignature(prev, signatureRef.current, updateAttributes));
	};

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		updateAttributes({ path: value });
	};

	return (
		<>
			<ActionInput
				defaultValue={node.attrs.path}
				icon="link"
				onChange={onChange}
				tooltipText={t("editor.video.link")}
			/>
			{node.attrs.path && (
				<a href={node.attrs.path} rel="noreferrer" target="_blank">
					<ActionButton icon="external-link" tooltipText={t("goto-original")} />
				</a>
			)}
			<ActionButton icon="captions" onClick={addSignature} tooltipText={t("signature")} />
		</>
	);
};

export default VideoActions;
