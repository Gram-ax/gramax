# gramax-cli

Gramax CLI is a versatile command-line tool designed to help developers generate static sites effortlessly from source directories created using the Gramax editor. Below is the official documentation to get you started.

## **Key Features**

-   **Static Site Generation:** Create static websites from specified directories with a single command.

-   **Error Checking:** Validate catalogs and identify issues before deployment.

-   **Import from Yandex Wiki:** Import entire catalogs from Yandex Wiki with automatic conversion to Gramax-compatible format or in raw markdown mode.

## **Installation**

You can use Gramax CLI in two ways: without installation via `npx` or by installing it globally.

### **Run Without Installation**

Use `npx` to run Gramax CLI without installing it:

```shell
npx gramax-cli <command> [options]
```

### **Install Globally**

Install Gramax CLI globally for frequent usage:

```shell
npm install -g gramax-cli
```

After installation, you can run the CLI from anywhere:

```shell
gramax-cli <command> [options]
```

## **Commands Overview**

### **Build Command**

The `build` command generates a static site from the specified source directory.

```shell
gramax-cli build --source <path> --destination <path> [--skip-check]
```

#### **Options**

| Option              | Description                                                   | Default                   |
| ------------------- | ------------------------------------------------------------- | ------------------------- |
| `--source, -s`      | Path to the source directory created using the Gramax editor. | Current working directory |
| `--destination, -d` | Path where the generated static site will be saved.           | `./build`                 |
| `--skip-check`      | Skips validation checks during the build process.             | `false`                   |

#### **Configuration**

Customize the build process using a `gramax.config.yaml` file in the source directory or environment variables.

**Example** `gramax.config.yaml`**:**

```yaml
build:
    logo:
        imageUrl: "https://example.com/logo.png"
        linkUrl: "https://example.com"
    metrics:
        yandex:
            metricCounter: 12345678
        matomo:
            siteId: 1
            matomoUrl: "https://example.com/matomo"
            matomoContainerUrl: "https://example.com/container"
```

**Environment Variable Overrides:**

-   `LOGO_LINK_URL`

-   `LOGO_IMAGE_URL`

-   `YANDEX_METRIC_COUNTER`

-   `MATOMO_SITE_ID`

-   `MATOMO_URL`

-   `MATOMO_CONTAINER_URL`

#### **Example**

Generate a static site from `./content` and save it to `./output`:

```shell
gramax-cli build --source ./content --destination ./output
```

### **Check Command**

The `check` command validates the specified catalog directory for errors.

```shell
gramax-cli check --destination <path> [--output <path>]
```

#### **Options**

| Option              | Description                                       | Default                   |
| ------------------- | ------------------------------------------------- | ------------------------- |
| `--destination, -d` | Path to the catalog directory for validation.     | Current working directory |
| `--output, -o`      | Path where the validation log file will be saved. | Not specified             |

#### **Example**

Run a check on `./catalog` and save the validation log to `./error-log.txt`:

```shell
gramax-cli check --destination ./catalog --output ./error-log.txt
```

### **Export Command**

The `export` command exports the specified catalog directory to a document format (docx or pdf).

```shell
gramax-cli export --source <path> --output <path> [--format <format>] [--yes]
```

#### **Options**

| Option           | Description                                                                                         | Default                   |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| `--source, -s`   | Path to the catalog directory for export.                                                           | Current working directory |
| `--output, -o`   | Path where the generated file will be saved.                                                        | `./export`                |
| `--format, -f`   | Export format: docx or pdf.                                                                         | `docx`                    |
| `--yes, -y`      | Skip confirmation.                                                                                  | `false`                   |
| `--template, -t` | Path to a template file, or template name from the workspace of the catalog (only for docx export). | Not specified             |

#### **Example**

Export catalog from `./content` to `./output.docx`:

```shell
gramax-cli export --source ./content --output ./output.docx
```

Export catalog to PDF format:

```shell
gramax-cli export --source ./content --output ./output.pdf --format pdf
```

### **Import Yandex Wiki**

The `import yandex-wiki` command fetches all your articles from Yandex Wiki, converting them into a format compatible with Gramax or importing them in raw markdown without transformations.

```shell
npx gramax-cli import yandex-wiki --destination <path> --config <path> [--raw]
```

#### **Options**

| Option              | Description                                              | Default                          |
| ------------------- | -------------------------------------------------------- | -------------------------------- |
| `--destination, -d` | Directory path for saving the imported catalog.          | Current working directory (`./`) |
| `--config, -c`      | Path to the directory containing the Gramax config file. | Current working directory (`./`) |
| `--raw, -r`         | Disable markdown transformations during import.          | `false`                          |

#### **Configuration**

To use this command, you **must** provide authorization details in your `gramax.config.yaml` file under the `import.yandex` section. These details include headers required to fetch your articles.

**Example** `gramax.config.yaml`:

```yaml
import:
    yandex:
        headers:
            "x-csrf-token": "your-csrf-token"
            "x-org-id": "your-org-id"
            cookie: "your-cookie-string"
            "x-collab-org-id": "optional-collab-org-id" # This parameter is optional
```

> ⚠️ **Important:** Ensure your configuration file contains accurate authorization data. For detailed instructions on obtaining these credentials, refer to the [official Gramax documentation](https://gram.ax/resources/docs/catalog/migration/yandex-wiki).

> Parameter x-collab-org-id is optional. If you don’t have this value, simply omit it in your configuration.
#### **Example**

Import all articles from Yandex Wiki into `./wiki-import` directory:

```shell
npx gramax-cli import yandex-wiki --destination ./wiki-import --config ./config-directory
```

To import without markdown transformation:

```shell
npx gramax-cli import yandex-wiki --raw --destination ./wiki-import --config ./config-directory
```

## **Utility Commands**

### **Version Command**

Display the current version of Gramax CLI:

```shell
gramax-cli --version
```

### **Help Command**

View all available commands and their options:

```shell
gramax-cli --help
```

## **License**

Gramax CLI is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).
