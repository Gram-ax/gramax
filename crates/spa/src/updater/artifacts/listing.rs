use quick_xml::events::Event;
use quick_xml::Reader;

use crate::updater::package::PlatformPackage;

pub struct ListObjectsPage {
	pub keys: Vec<String>,
	pub common_prefixes: Vec<String>,
	pub next_continuation_token: Option<String>,
}

pub fn parse_list_objects_page(xml: &str) -> Result<ListObjectsPage, quick_xml::Error> {
	#[derive(Clone, Copy)]
	enum Field {
		Key,
		CommonPrefix,
		NextContinuationToken,
	}

	let mut reader = Reader::from_str(xml);
	let mut keys = Vec::new();
	let mut common_prefixes = Vec::new();
	let mut next_continuation_token = None;
	let mut field: Option<Field> = None;
	// The top-level <Prefix> echoes the request; only <Prefix> inside <CommonPrefixes> is a result.
	let mut in_common_prefixes = false;

	loop {
		match reader.read_event()? {
			Event::Start(start) => {
				field = match start.name().as_ref() {
					b"Key" => Some(Field::Key),
					b"CommonPrefixes" => {
						in_common_prefixes = true;
						None
					}
					b"Prefix" if in_common_prefixes => Some(Field::CommonPrefix),
					b"NextContinuationToken" => Some(Field::NextContinuationToken),
					_ => None,
				}
			}
			Event::Text(text) => {
				let Some(current) = field else { continue };
				let text = text.decode()?.into_owned();

				match current {
					Field::Key => keys.push(text),
					Field::CommonPrefix => common_prefixes.push(text),
					Field::NextContinuationToken => next_continuation_token = Some(text),
				}
			}
			Event::End(end) => {
				if end.name().as_ref() == b"CommonPrefixes" {
					in_common_prefixes = false;
				}
				field = None;
			}
			Event::Eof => break,
			_ => {}
		}
	}

	Ok(ListObjectsPage {
		keys,
		common_prefixes,
		next_continuation_token,
	})
}

pub fn is_release_line(line_prefix: &str) -> bool {
	let Some(line) = line_prefix.strip_suffix('/') else { return false };
	let Some((major, minor)) = line.split_once('.') else { return false };
	major.parse::<u64>().is_ok() && minor.parse::<u64>().is_ok()
}

// Channel-relative installer key: `<major.minor>/<patch[-pre]>/<platform>/<artifact>`.
// Anything else — latest pointers, update archives, signatures — parses to None.
pub fn parse_installer_key(relative_key: &str) -> Option<(semver::Version, PlatformPackage)> {
	let mut parts = relative_key.split('/');
	let major_minor = parts.next()?;
	let patch = parts.next()?;
	let platform = parts.next()?;
	let artifact = parts.next()?;

	if parts.next().is_some() {
		return None;
	}

	let version = semver::Version::parse(&format!("{major_minor}.{patch}")).ok()?;

	PlatformPackage::all()
		.into_iter()
		.find(|pp| pp.platform().as_ref() == platform && pp.installer_artifact_name() == artifact)
		.map(|pp| (version, pp))
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn parses_keys_and_continuation_token() {
		let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
			<ListBucketResult>
				<Name>bucket</Name>
				<Prefix>dev/</Prefix>
				<IsTruncated>true</IsTruncated>
				<Contents><Key>dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg</Key><Size>1</Size></Contents>
				<Contents><Key>dev/1.2/0/linux-x86_64/gramax.linux-x86_64.deb</Key><Size>1</Size></Contents>
				<NextContinuationToken>token-1</NextContinuationToken>
			</ListBucketResult>"#;

		let page = parse_list_objects_page(xml).unwrap();

		assert_eq!(
			page.keys,
			[
				"dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg",
				"dev/1.2/0/linux-x86_64/gramax.linux-x86_64.deb"
			]
		);
		assert_eq!(page.next_continuation_token.as_deref(), Some("token-1"));
	}

	#[test]
	fn parses_common_prefixes_of_delimiter_listing() {
		let xml = r#"<ListBucketResult>
				<Prefix>dev/</Prefix>
				<Delimiter>/</Delimiter>
				<IsTruncated>false</IsTruncated>
				<CommonPrefixes><Prefix>dev/2026.7/</Prefix></CommonPrefixes>
				<CommonPrefixes><Prefix>dev/latest/</Prefix></CommonPrefixes>
			</ListBucketResult>"#;

		let page = parse_list_objects_page(xml).unwrap();

		// the top-level request-echo <Prefix> must not leak into the results
		assert_eq!(page.common_prefixes, ["dev/2026.7/", "dev/latest/"]);
		assert!(page.keys.is_empty());
	}

	#[test]
	fn release_lines() {
		assert!(is_release_line("2026.7/"));
		assert!(is_release_line("1.12/"));
		assert!(!is_release_line("latest/"));
		assert!(!is_release_line("2026.7"));
		assert!(!is_release_line("releases/"));
	}

	#[test]
	fn parses_last_page_without_token() {
		let xml = r#"<ListBucketResult>
				<IsTruncated>false</IsTruncated>
				<Contents><Key>dev/latest/gramax.darwin-aarch64.dmg.version</Key></Contents>
			</ListBucketResult>"#;

		let page = parse_list_objects_page(xml).unwrap();

		assert_eq!(page.keys, ["dev/latest/gramax.darwin-aarch64.dmg.version"]);
		assert_eq!(page.next_continuation_token, None);
	}

	#[test]
	fn parses_installer_keys() {
		let parsed = parse_installer_key("1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg");
		assert_eq!(
			parsed,
			Some((semver::Version::parse("1.1.1").unwrap(), PlatformPackage::DarwinAarch64Dmg))
		);

		let parsed = parse_installer_key("1.2/0-rc.1/windows-x86_64/gramax.windows-x86_64.setup.exe");
		assert_eq!(
			parsed,
			Some((semver::Version::parse("1.2.0-rc.1").unwrap(), PlatformPackage::WindowsX86_64Nsis))
		);
	}

	#[test]
	fn skips_non_installer_keys() {
		// update archives and signatures must never be exposed
		assert_eq!(parse_installer_key("1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz"), None);
		assert_eq!(parse_installer_key("1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig"), None);
		assert_eq!(parse_installer_key("1.1/1/linux-x86_64/gramax.linux-x86_64.deb.sig"), None);

		// latest pointers and unknown layouts
		assert_eq!(parse_installer_key("latest/gramax.darwin-aarch64.dmg.version"), None);
		assert_eq!(parse_installer_key("1.1/latest/gramax.darwin-aarch64.dmg.version"), None);
		assert_eq!(parse_installer_key("1.1/1/darwin-aarch64"), None);
		assert_eq!(parse_installer_key("1.1/1/darwin-aarch64/extra/gramax.darwin-aarch64.dmg"), None);
	}
}
