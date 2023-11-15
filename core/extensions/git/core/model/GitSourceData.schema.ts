import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

interface GitSourceData extends SourceData {
	/**
	 * @title Тип
	 * @default ""
	 */
	sourceType: SourceType.gitHub | SourceType.gitLab | SourceType.enterprise;
	/**
	 * @title GitLab-токен
	 * @format glpat-aq6PK8sz1eQeKhTy-Dm5
	 * @description Токен для доступа к удаленным репозиториям. [Подробнее](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html).
	 */
	token: string;
	/**
	 * @title Домен
	 * @format gitlab.com
	 * @description Войдите в GitLab и скопируйте URL с главной страницы.
	 */
	domain: string;
}

export default GitSourceData;
