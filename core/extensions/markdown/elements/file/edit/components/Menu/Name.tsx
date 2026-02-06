import type Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import type { ResourceError } from "@ext/markdown/elements/copyArticles/errors/ResourceError";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { openFilePreview } from "@ext/markdown/elements/file/edit/logic/openFilePreview";

const Anchor = styled.a`
	color: var(--color-article-bg) !important;
	width: 100% !important;
	text-decoration: none !important;
`;

interface NameProps {
	path: Path;
	openInSupportedApp: () => void;
	downloadResource: () => void;
	onError: (error: ResourceError | null) => void;
}

const StyledButton = styled(Button)`
	.button .iconFrame {
		padding: 4.5px 7px;
		display: flex;
	}

	.button .iconFrame span {
		white-space: nowrap;
		overflow: hidden;
		line-height: 1.2;
		text-overflow: ellipsis;
	}

	.button .iconFrame i {
		align-items: flex-start;
		justify-content: center;
		display: flex;
	}
`;

const Name = ({ path, downloadResource, onError, openInSupportedApp }: NameProps) => {
	const resourceService = ResourceService.value;
	const openPreview = async () => {
		const data = await resourceService.getResource(path.value);
		if (data.error) return onError(data.error);
		if (!data.buffer) return onError(null);

		openFilePreview(data.buffer, path, {
			onError: () => onError(data.error),
			openInSupportedApp,
			downloadResource,
		});
	};

	return (
		<Anchor onClick={openPreview}>
			<StyledButton icon={"file"} text={path.nameWithExtension} title={path.nameWithExtension} />
		</Anchor>
	);
};

export default Name;
