pub mod branch;
pub mod diff;
pub mod merge;
pub mod remote;
pub mod stash;
pub mod status;

pub mod prelude {
  pub use crate::actions::branch::*;
  pub use crate::actions::diff::*;
  pub use crate::actions::merge::*;
  pub use crate::actions::remote::*;
  pub use crate::actions::stash::*;
  pub use crate::actions::status::*;
}
