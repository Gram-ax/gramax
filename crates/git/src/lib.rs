use std::ops::Deref;
use std::time::Duration;

#[macro_use]
extern crate log;

pub mod commands;

pub mod actions;
mod cache;
pub mod creds;
pub mod error;
pub mod ext;
pub mod prelude;
mod remote_callback;
pub mod repo;
pub mod repo_ext;

pub mod git2 {
  pub use git2::*;
}

pub(crate) type Result<T> = std::result::Result<T, error::Error>;

pub trait ShortInfo<'i, T: serde::Serialize> {
  fn short_info(&'i self) -> Result<T>;
}

#[derive(serde::Serialize, serde::Deserialize, Clone, PartialEq, Debug)]
#[serde(transparent)]
pub struct OidInfo(String);

impl Deref for OidInfo {
  type Target = String;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl TryFrom<OidInfo> for ::git2::Oid {
  type Error = ::git2::Error;

  fn try_from(value: OidInfo) -> std::result::Result<Self, Self::Error> {
    ::git2::Oid::from_str(&value.0).map_err(|_| ::git2::Error::from_str("invalid oid"))
  }
}

impl<'s> From<&'s ::git2::Oid> for OidInfo {
  fn from(value: &'s ::git2::Oid) -> Self {
    OidInfo(value.to_string())
  }
}

impl<'s> ShortInfo<'s, OidInfo> for ::git2::Oid {
  fn short_info(&'s self) -> Result<OidInfo> {
    Ok(OidInfo::from(self))
  }
}

#[derive(Clone, PartialEq, Debug)]
pub struct SinglelineSignature {
  pub name: String,
  pub email: String,
}

impl<'s> From<&'s ::git2::Signature<'s>> for SinglelineSignature {
  fn from(value: &'s ::git2::Signature<'s>) -> Self {
    SinglelineSignature {
      name: value.name().unwrap_or("<invalid-utf8>").into(),
      email: value.email().unwrap_or("<invalid-utf8>").into(),
    }
  }
}

impl<'s> ShortInfo<'s, SinglelineSignature> for ::git2::Signature<'s> {
  fn short_info(&'s self) -> Result<SinglelineSignature> {
    Ok(SinglelineSignature::from(self))
  }
}

struct SinglelineSignatureVisitor;

impl serde::de::Visitor<'_> for SinglelineSignatureVisitor {
  type Value = SinglelineSignature;

  fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
    formatter.write_str("string in the format of `name <email>`")
  }

  fn visit_str<E: serde::de::Error>(self, v: &str) -> std::result::Result<Self::Value, E> {
    let open_bracket_index = v.find('<').ok_or(E::custom("invalid signature, missing `<`"))?;
    let close_bracket_index = v.find('>').ok_or(E::custom("invalid signature, missing `>`"))?;
    if open_bracket_index >= close_bracket_index {
      return Err(E::custom("invalid signature, expected `name <email>`"));
    }

    let name = &v[..open_bracket_index].trim();
    let email = &v[open_bracket_index + 1..close_bracket_index].trim();
    Ok(SinglelineSignature { name: name.to_string(), email: email.to_string() })
  }
}

impl serde::Serialize for SinglelineSignature {
  fn serialize<S: serde::Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(&format!("{} <{}>", self.name, self.email))
  }
}

impl<'de> serde::Deserialize<'de> for SinglelineSignature {
  fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> std::result::Result<Self, D::Error> {
    deserializer.deserialize_str(SinglelineSignatureVisitor)
  }
}

#[cfg(target_family = "wasm")]
pub(crate) fn time_now() -> Duration {
  extern "C" {
    fn emscripten_get_now() -> f64;
  }
  Duration::from_millis(unsafe { emscripten_get_now() as u64 })
}

#[cfg(not(target_family = "wasm"))]
pub(crate) fn time_now() -> Duration {
  use std::time::SystemTime;
  SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap()
}
