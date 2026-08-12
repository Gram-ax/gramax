import Divider from "@components/Atoms/Divider";
import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import FileInput from "@components/Atoms/FileInput/FileInput";
import Path from "@core/FileProvider/Path/Path";
import getStringByteSize from "@core/utils/getStringByteSize";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ArticleContextWrapper from "@core-ui/ScopedContextWrapper/ArticleContextWrapper";
import CatalogContextWrapper from "@core-ui/ScopedContextWrapper/CatalogContextWrapper";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { OpenUnknownFile } from "@ext/git/actions/Publish/components/OpenUnknownFile";
import { useResourceViewResolver } from "@ext/git/actions/Publish/logic/useResourceViewResolver";
import { DOCUMENT_SIZE_LIMIT_BYTES } from "@ext/git/actions/Publish/model/consts";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import type { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { CSSProperties } from "react";

export type ResourceType = "image" | "diagram" | "text" | "unknown";

interface DiffResourceScopesWrapperProps {
	parentPath: DiffFilePaths;
	children: JSX.Element;
	oldScope: TreeReadScope;
	status: FileStatus;
	type: ResourceType;
	newScope: TreeReadScope;
	oldChildren?: JSX.Element;
}

interface ResourceDiffViewProps {
	children: JSX.Element;
	type: ResourceType;
	newContent: string;
	oldContent: string;
	filePath: DiffFilePaths;
	status: FileStatus;
	isTextTooLarge?: boolean;
}

const StatusWrapper = ({ children, status, isImg }: { children: JSX.Element; status: FileStatus; isImg: boolean }) => {
	const isNew = status === FileStatus.new;
	const isDelete = status === FileStatus.delete;
	const hasStatus = isNew || isDelete;

	if (!hasStatus) return children;

	const borderColor = isNew ? "var(--color-status-new)" : "var(--color-status-deleted)";

	if (isImg) {
		return (
			<div
				className="[&_img]:rounded-sm [&_img]:shadow-none [&_img]:[border:2px_solid_var(--img-status-border)]"
				style={{ "--img-status-border": borderColor } as CSSProperties}
			>
				{children}
			</div>
		);
	}

	return (
		<div className="rounded-sm" style={{ border: `2px solid ${borderColor}` }}>
			{children}
		</div>
	);
};

const DiffResourceScopesWrapper = (props: DiffResourceScopesWrapperProps) => {
	const { children, oldScope, newScope, status, oldChildren, parentPath, type } = props;
	const hasParentPath = !!parentPath?.path || !!parentPath?.oldPath;

	const currentArticlePath = useArticlePropsStore((s) => s.data.ref.path);
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const newArticlePath = parentPath?.path ? Path.join(catalogName, parentPath.path) : currentArticlePath;
	const oldArticlePath = parentPath?.oldPath ? Path.join(catalogName, parentPath.oldPath) : currentArticlePath;

	const isImg = type === "image";

	if (!oldChildren) {
		const isDeleted = status === FileStatus.delete;

		return (
			<div
				className={cn(
					"max-w-[var(--article-max-width)] overflow-y-auto",
					status === FileStatus.delete && "content-center",
				)}
				data-status={status}
			>
				<StatusWrapper isImg={isImg} status={status}>
					<ScopeWrapper
						articlePath={isDeleted ? oldArticlePath : newArticlePath}
						hasParentPath={hasParentPath}
						scope={isDeleted ? oldScope : newScope}
					>
						{children}
					</ScopeWrapper>
				</StatusWrapper>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"max-w-[var(--article-max-width)] overflow-y-auto",
				status === FileStatus.delete && "content-center",
			)}
			data-status={status}
		>
			<StatusWrapper isImg={isImg} status={FileStatus.delete}>
				<ScopeWrapper articlePath={oldArticlePath} hasParentPath={hasParentPath} scope={oldScope}>
					{oldChildren}
				</ScopeWrapper>
			</StatusWrapper>
			<Divider style={{ marginBottom: "0.5rem", marginTop: "0.5rem" }} />
			<StatusWrapper isImg={isImg} status={FileStatus.new}>
				<ScopeWrapper articlePath={newArticlePath} hasParentPath={hasParentPath} scope={newScope}>
					{children}
				</ScopeWrapper>
			</StatusWrapper>
		</div>
	);
};

export interface UseResourceArticleViewType {
	parentPath: DiffFilePaths;
	id: number;
	resourcePath: Path;
	type: ResourceType;
	oldResourcePath?: Path;
	filePath?: DiffFilePaths;
	relativeTo?: Path;
	oldRelativeTo?: Path;
	status?: FileStatus;
	newContent?: string;
	oldContent?: string;
	oldScope?: TreeReadScope;
	newScope?: TreeReadScope;
}

const ExactResourceViewWithContent = (props: UseResourceArticleViewType) => {
	const {
		parentPath,
		id,
		resourcePath,
		type,
		oldResourcePath,
		relativeTo,
		oldRelativeTo,
		newContent,
		oldContent,
		filePath,
		status,
		oldScope,
		newScope,
	} = props;
	const ext = resourcePath.extension;

	const isTextTooLarge =
		type === "text" &&
		(getStringByteSize(newContent) > DOCUMENT_SIZE_LIMIT_BYTES ||
			getStringByteSize(oldContent) > DOCUMENT_SIZE_LIMIT_BYTES);
	const src = relativeTo ? relativeTo.getRelativePath(resourcePath).value : resourcePath.nameWithExtension;
	const oldSrc = oldRelativeTo
		? oldRelativeTo.getRelativePath(oldResourcePath).value
		: oldResourcePath.nameWithExtension;
	const isDeleteOrAdded = status === FileStatus.delete || status === FileStatus.new;

	const { element, oldElement } = useResourceViewResolver({
		type,
		src,
		oldSrc,
		extension: ext,
		parentPath,
		filePath,
		isDeleteOrAdded,
	});

	return (
		<ResourceDiffView
			filePath={filePath}
			isTextTooLarge={isTextTooLarge}
			key={filePath.path}
			newContent={newContent}
			oldContent={oldContent}
			status={status}
			type={type}
		>
			{element && (
				<div className="article flex items-center justify-center w-full h-full" key={id}>
					<DiffResourceScopesWrapper
						newScope={newScope}
						oldChildren={oldElement}
						oldScope={oldScope}
						parentPath={parentPath}
						status={status}
						type={type}
					>
						{element}
					</DiffResourceScopesWrapper>
				</div>
			)}
		</ResourceDiffView>
	);
};

type ContextWrapperProps = { children: JSX.Element; scope?: TreeReadScope } & (
	| { hasParentPath: false }
	| { hasParentPath: true; articlePath: string }
);

const ScopeWrapper = (props: ContextWrapperProps) => {
	const { scope, children, hasParentPath } = props;

	if (hasParentPath) {
		return (
			<ArticleContextWrapper articlePath={props.articlePath} scope={scope}>
				{children}
			</ArticleContextWrapper>
		);
	}

	return <CatalogContextWrapper scope={scope}>{children}</CatalogContextWrapper>;
};

const DiffMessage = ({ children, resourcePath }: { children: JSX.Element; resourcePath: string }) => {
	const { isTauri } = usePlatform();
	return (
		<div className="flex items-center justify-center h-full p-4 text-center text-[var(--color-text-secondary)]">
			<div>
				{children}
				{isTauri && (
					<div className="flex items-center justify-center mt-2">
						<OpenUnknownFile resourcePath={resourcePath} />
					</div>
				)}
			</div>
		</div>
	);
};

const ResourceDiffView = (props: ResourceDiffViewProps) => {
	const { children, type, newContent, oldContent, filePath, status, isTextTooLarge } = props;
	const isDoublePanel = useIsDoublePanel();

	const resourceView = () => {
		if (isTextTooLarge)
			return <DiffMessage resourcePath={filePath?.path}>{t("diff.file-too-large-for-preview")}</DiffMessage>;
		if (type === "unknown")
			return <DiffMessage resourcePath={filePath?.path}>{t("diff.unknown-extension")}</DiffMessage>;
		if (children) return children;
		if (status === FileStatus.delete || status === FileStatus.new)
			return (
				<FileInput
					height="100vh"
					onMount={(editor) => {
						// https://github.com/microsoft/monaco-editor/issues/4448
						editor.updateOptions({ glyphMargin: false });
					}}
					options={{
						readOnly: true,
						glyphMargin: false,
					}}
					style={{ padding: "0" }}
					value={status === FileStatus.new ? newContent : oldContent}
				/>
			);
		return (
			<DiffFileInput
				containerStyles={{ padding: "0" }}
				height={"100vh"}
				modified={newContent}
				onMount={(editor) => {
					// https://github.com/microsoft/monaco-editor/issues/4448
					editor.getOriginalEditor().updateOptions({ glyphMargin: false });
				}}
				options={{
					readOnly: true,
					renderSideBySide: isDoublePanel,
					useInlineViewWhenSpaceIsLimited: false,
					glyphMargin: false,
				}}
				original={oldContent}
			/>
		);
	};

	return resourceView();
};

export default ExactResourceViewWithContent;
