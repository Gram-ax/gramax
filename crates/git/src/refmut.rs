use std::ops::Deref;

#[allow(unused)]
pub enum RefOrMut<'a, T> {
  Ref(&'a T),
  Mut(&'a mut T),
  Owned(T),
}

impl<'a, T> RefOrMut<'a, T> {
  pub fn as_ref(&self) -> &T {
    match self {
      RefOrMut::Ref(t) => t,
      RefOrMut::Mut(t) => t,
      RefOrMut::Owned(t) => t,
    }
  }

  pub fn as_mut(&mut self) -> Option<&mut T> {
    match self {
      RefOrMut::Mut(t) => Some(t),
      RefOrMut::Owned(ref mut t) => Some(&mut *t),
      RefOrMut::Ref(_) => None,
    }
  }

  pub fn take(self) -> Option<T> {
    match self {
      RefOrMut::Owned(t) => Some(t),
      _ => None,
    }
  }
}

impl<'a, T> Deref for RefOrMut<'a, T> {
  type Target = T;

  fn deref(&self) -> &Self::Target {
    self.as_ref()
  }
}
