import type { Section } from "@core/SitePresenter/SitePresenter";
import Search from "@ext/serach/components/Search";

const TopMenuSearch = ({ section }: { section?: Section }) => <Search isHomePage section={section} />;

export default TopMenuSearch;
