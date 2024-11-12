import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Alert, { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import { addGitTreeScopeToPath } from "@ext/versioning/utils";
import type { HTMLAttributes } from "react";

export type NotActualRevisionWarningProps = HTMLAttributes<HTMLDivElement>;

// todo: убрать разрыв при переносе слова в code
const NotActualRevisionWarning = (props: NotActualRevisionWarningProps) => {
	const catalogProps = CatalogPropsService.value;
	const router = useRouter();

	const { className, ...restProps } = props;

	const url = addGitTreeScopeToPath(router.path);

	return (
		<div data-qa="switch-version-warning" className={classNames(className, {}, ["article-body"])} {...restProps}>
			<Alert type={AlertType.warning} title={t("versions.not-actual-warning.header")}>
				<div>
					<div>
						{t("versions.not-actual-warning.1")}
						<code>
							<Icon code="tag" />
							<span>{catalogProps.resolvedVersion?.name}</span>
						</code>
					</div>
					<div
						dangerouslySetInnerHTML={{
							__html: t("versions.not-actual-warning.2").replace("{{link}}", url),
						}}
					/>
				</div>
			</Alert>
		</div>
	);
};

export default styled(NotActualRevisionWarning)`
	flex: 0 !important;
`;
