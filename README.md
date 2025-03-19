![Gramax logo](./logo.svg)

[Gramax](https://gram.ax)  is a free, open-source application for creating, editing, and publishing docs as code. It stores all data locally in Markdown format, offering flexibility and offline access, and seamlessly integrates with Git for version control and collaboration. Whether you need a product documentation portal, an internal knowledge base, project documentation, or personal notes, Gramax is a versatile solution.

**Looking for an alternative to GitBook, Mintlify, or typical Static Site Generators (SSGs)?**  
Gramax provides a powerful, Markdown-based approach that combines an intuitive visual editor with robust Git integration.

## Features

-  **Visual Editor**: Makes editing Markdown-files easy for technical and non-technical users.

-  **Cross-Platform**: Available as a desktop app (Windows, Mac, Linux) and a browser-based version.

-  **Local Storage**: Files are stored locally in Markdown, editable in any text editor.

-  **Customizable Styles**: Personalize the app and documentation portal appearance.

-  **Multilingual Support**: Create documentation in 17 languages, including English, Spanish, and more.

-  **Advanced Editing**: Supports tabs, tables, video embedding, code blocks, diagrams (Mermaid, Excalidraw, Diagrams.net), and Swagger API descriptions.

-  **Git Integration**: Connect to Git repositories (GitHub, GitLab, Bitbucket, Gitea, etc.) for version control and collaboration.

-  **Documentation Portal**: Publish catalogs to a dedicated, customizable website.

-  **Migration Support**: Import from Confluence and Notion with preserved formatting and hierarchy.

## Installation

### Editor app

-  Access it at [app.gram.ax](http://app.gram.ax).

-  Download the app for your OS from [gram.ax](http://gram.ax).

## Usage

1. **Create a Catalog**: Add a catalog within a workspace to store articles.

2. **Edit Articles**: Use the Markdown editor with features like tabs, tables, and multimedia.

3. **Connect to Git**: Link your catalog to a Git repository for collaboration.

4. **Synchronize Changes**: Pull and push updates via built-in Git commands, resolving conflicts as needed.

5. **Publish**: Share your catalog to the documentation portal.

For more details, see the [official documentation](https://gram.ax/resources/docs/en).

## Documentation Portal

Publish your documentation as a website, hosted on your server or as a static site.

### Setup

-  **Docker**: Deploy with docker-compose.yaml from [gram.ax/docker-compose.yaml](http://gram.ax/docker-compose.yaml).

-  **Static Site**:

   1.   `npm install -g gramax-cli`.

   2.  `gramax-cli build --source ./content --destination ./output`.

See [Setting Up the Documentation Portal](https://gram.ax/resources/docs/en/doc-portal) for instructions.

## Contact

For support or questions, email [info@gram.ax](mailto:info@gram.ax), join our community chat in [Telegram](https://t.me/gramax_community_en) or visit our [GitHub issues page](https://github.com/Gram-ax/gramax/issues).
