use std::path::PathBuf;

use git2::*;

use crate::creds::Creds;

type CredentialsCallback<'c> = Box<dyn FnMut(&str, Option<&str>, CredentialType) -> Result<Cred, Error> + 'c>;

pub trait AddCredentialsHeaders {
  fn add_credentials_headers<C: Creds>(&mut self, creds: &C);
}

impl AddCredentialsHeaders for FetchOptions<'_> {
  fn add_credentials_headers<C: Creds>(&mut self, creds: &C) {
    self.custom_headers(&[&format!("x-private-token: {}", creds.access_token())]);

    if let Some(protocol) = creds.protocol() {
      self.custom_headers(&[&format!("x-protocol: {}", protocol)]);
    }
  }
}

impl AddCredentialsHeaders for PushOptions<'_> {
  fn add_credentials_headers<C: Creds>(&mut self, creds: &C) {
    self.custom_headers(&[&format!("x-private-token: {}", creds.access_token())]);

    if let Some(protocol) = creds.protocol() {
      self.custom_headers(&[&format!("x-protocol: {}", protocol)]);
    }
  }
}

pub fn ssl_callback(_cert: &cert::Cert, _host: &str) -> Result<CertificateCheckStatus, Error> {
  #[cfg(not(target_os = "android"))]
  return Ok(CertificateCheckStatus::CertificatePassthrough);

  #[cfg(target_os = "android")]
  return Ok(CertificateCheckStatus::CertificateOk);
}

pub fn make_credentials_callback<C: Creds>(creds: &C) -> CredentialsCallback {
  let mut identities = resolve_identities();
  Box::new(move |url: &str, username: Option<&str>, allowed_type: CredentialType| -> Result<Cred, Error> {
    match allowed_type {
      allowed if allowed.contains(CredentialType::SSH_KEY) => {
        let Some(identity) =
          resolve_identity_from_config(url).or_else(|| identities.as_mut().and_then(|i| i.next()))
        else {
          return Err(Error::new(ErrorCode::Auth, ErrorClass::Ssh, "No identity found"));
        };
        Cred::ssh_key(username.unwrap(), None, &identity, None)
      }
      allowed if allowed.contains(CredentialType::USERNAME) => Cred::username("git"),
      _ => Cred::userpass_plaintext("git", creds.access_token()),
    }
  })
}

pub fn push_update_reference_callback(
  refname: &str,
  status: Option<&str>,
) -> std::result::Result<(), git2::Error> {
  if let Some(status) = status {
    return Err(git2::Error::new(
      ErrorCode::Invalid,
      ErrorClass::Net,
      format!("Failed to push {}: {}", refname, status),
    ));
  }
  Ok(())
}

#[cfg(not(target_family = "wasm"))]
fn resolve_identity_from_config(url: &str) -> Option<PathBuf> {
  use ssh2_config::ParseRule;
  use ssh2_config::SshConfig;

  let host = url.splitn(2, '@').last()?.split(':').next()?;
  SshConfig::parse_default_file(ParseRule::ALLOW_UNKNOWN_FIELDS)
    .ok()
    .and_then(|config| config.query(host).identity_file.map(|i| i.into_iter().next()))
    .flatten()
    .filter(|path| path.exists())
}

#[cfg(not(target_family = "wasm"))]
fn resolve_identities() -> Option<impl Iterator<Item = PathBuf>> {
  let ssh_dir = dirs::home_dir()?.join(".ssh");
  let files = ssh_dir.read_dir().ok()?;
  let iter = files
    .filter_map(|f| f.ok())
    .filter(|f| {
      f.file_name()
        .to_str()
        .is_some_and(|name| !name.ends_with(".pub") && !name.starts_with("known_hosts") && name != "config")
    })
    .map(|f| f.path());
  Some(iter)
}

#[cfg(target_family = "wasm")]
fn resolve_identities() -> Option<impl Iterator<Item = PathBuf>> {
  Some(vec![].into_iter())
}

#[cfg(target_family = "wasm")]
fn resolve_identity_from_config(_url: &str) -> Option<PathBuf> {
  None
}
