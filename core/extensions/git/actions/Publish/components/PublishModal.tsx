import ModalLayout from "@components/Layouts/Modal";
import useTrigger from "@core-ui/triggers/useTrigger";
import Publish from "@ext/git/actions/Publish/components/Publish";
import { useEffect, useRef, useState } from "react";

interface PublishModalProps {
	onOpen?: () => void;
	onClose?: (hasDiscard: boolean, hasPublished: boolean) => void | Promise<void>;
}

const PublishModal = (props: PublishModalProps) => {
	const { onClose, onOpen } = props;

	const [isOpen, setIsOpen] = useState(true);
	const [sideBarDataLoaded, setSideBarDataLoaded] = useState(false);
	const [cmdEnterTiggerValue, cmdEnterTrigger] = useTrigger();

	const hasDiscard = useRef(false);
	const hasPublished = useRef(false);

	useEffect(() => {
		setIsOpen(true);
		onOpen?.();
	}, []);

	return (
		<ModalLayout
			isOpen={isOpen}
			onClose={async () => {
				await onClose?.(hasDiscard.current, hasPublished.current);
			}}
			className={"commit-modal"}
			contentWidth={sideBarDataLoaded ? "L" : null}
			onCmdEnter={cmdEnterTrigger}
		>
			<Publish
				tryPublishTrigger={cmdEnterTiggerValue}
				onSideBarDataChange={(newSideBarData) => {
					const isEmpty = newSideBarData.filter((x) => x).length === 0;
					if (isEmpty && hasDiscard.current) setIsOpen(false);
				}}
				onSideBarDataLoadEnd={() => setSideBarDataLoaded(true)}
				onSideBarDataLoadError={() => setIsOpen(false)}
				onEndDiscard={(_, hasDeleted) => {
					hasDiscard.current = hasDeleted;
				}}
				onStartPublish={() => {
					hasPublished.current = true;
				}}
				onStopPublish={() => {
					setIsOpen(false);
				}}
				goToArticleOnClick={() => setIsOpen(false)}
			/>
		</ModalLayout>
	);
};

export default PublishModal;
