#![cfg(windows)]

#[link_section = ".CRT$XCU"]
#[used]
static INIT_SET_DLL_DIR: unsafe extern "C" fn() = {
	unsafe extern "C" fn set_dll_dir() {
		set_library_directories();
	}

	set_dll_dir
};

fn set_library_directories() {
	use windows_sys::Win32::Foundation::GetLastError;
	use windows_sys::Win32::System::LibraryLoader::SetDefaultDllDirectories;
	use windows_sys::Win32::System::LibraryLoader::SetDllDirectoryW;
	use windows_sys::Win32::System::LibraryLoader::LOAD_LIBRARY_SEARCH_SYSTEM32;
	use windows_sys::Win32::System::LibraryLoader::LOAD_LIBRARY_SEARCH_USER_DIRS;

	const LOAD_LIBRARY_FLAGS: u32 = LOAD_LIBRARY_SEARCH_SYSTEM32 | LOAD_LIBRARY_SEARCH_USER_DIRS;

	unsafe {
		let dll_dir = windows_sys::w!("C:\\Windows\\System32");

		let 1 = SetDllDirectoryW(dll_dir) else {
			panic!("failed to set dll directory; error code: {}", GetLastError());
		};

		let 1 = SetDefaultDllDirectories(LOAD_LIBRARY_FLAGS) else {
			panic!("failed to set default dll directories; error code: {}", GetLastError());
		};
	}
}
