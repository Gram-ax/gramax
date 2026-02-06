import { default as SharedPage } from "@shared-pom/page";
import { CatalogPom } from "./catalog.pom";
import { WorkspacePom } from "./workspace.pom";

export default class Page extends SharedPage {
	catalog(name: string): CatalogPom {
		return new CatalogPom(this._page, name);
	}

	workspace(): WorkspacePom {
		return new WorkspacePom(this._page);
	}
}
