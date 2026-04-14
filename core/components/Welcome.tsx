import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/article/actions/CreateFirstArticle";
import t from "@ext/localization/locale/translate";

type WelcomeProps = {
	data: ArticlePageData;
};

const WelcomeStyled = styled.div`
	height: 100%;
    display: flex;
	align-items: center;
    justify-content: center;
`;

const WelcomeContainer = styled.div`
	display: flex;
	max-width: 29rem;
    padding: 1rem 2rem;
    text-align: center;
	height: fit-content;
	align-items: center;
	flex-direction: column;
    background: var(--color-code-bg);
    border-radius: var(--radius-large);
`;

const Welcome = ({ data }: WelcomeProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	return (
		<WelcomeStyled>
			<WelcomeContainer>
				<>
					<h2 style={{ marginTop: "0" }}>{t("so-far-its-empty")}</h2>
					{!isReadOnly && (
						<>
							<p>{t("article.create.body")}</p>
							<CreateFirstArticle data={data} />
						</>
					)}
				</>
			</WelcomeContainer>
		</WelcomeStyled>
	);
};

export default Welcome;
