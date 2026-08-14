#[cfg(target_os = "windows")]
mod sys {
    use std::ptr::null_mut;
    use crate::error::AppError;

    #[allow(clippy::upper_case_acronyms)]
    #[repr(C)]
    struct CREDENTIALW {

        flags: u32,
        type_: u32,
        target_name: *mut u16,
        comment: *mut u16,
        last_written: u64,
        credential_blob_size: u32,
        credential_blob: *mut u8,
        persist: u32,
        attribute_count: u32,
        attributes: *mut std::ffi::c_void,
        target_alias: *mut u16,
        user_name: *mut u16,
    }

    const CRED_TYPE_GENERIC: u32 = 1;
    const CRED_PERSIST_SESSION: u32 = 1;

    extern "system" {
        fn CredWriteW(credential: *const CREDENTIALW, flags: u32) -> i32;
        fn CredDeleteW(target_name: *const u16, type_: u32, flags: u32) -> i32;
        fn CredEnumerateW(
            filter: *const u16,
            flags: u32,
            count: *mut u32,
            credentials: *mut *mut *mut CREDENTIALW,
        ) -> i32;
        fn CredFree(buffer: *mut std::ffi::c_void);
    }

    fn to_wide_null(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    pub fn write_windows_credential(
        target_name: &str,
        username: &str,
        password: &str,
    ) -> Result<(), AppError> {
        let mut target_wide = to_wide_null(target_name);
        let mut user_wide = to_wide_null(username);
        let pass_wide = to_wide_null(password);
        let pass_bytes = unsafe {
            std::slice::from_raw_parts(
                pass_wide.as_ptr() as *const u8,
                (pass_wide.len() - 1) * 2,
            )
        };

        let cred = CREDENTIALW {
            flags: 0,
            type_: CRED_TYPE_GENERIC,
            target_name: target_wide.as_mut_ptr(),
            comment: null_mut(),
            last_written: 0,
            credential_blob_size: pass_bytes.len() as u32,
            credential_blob: pass_bytes.as_ptr() as *mut u8,
            persist: CRED_PERSIST_SESSION,
            attribute_count: 0,
            attributes: null_mut(),
            target_alias: null_mut(),
            user_name: user_wide.as_mut_ptr(),
        };

        let res = unsafe { CredWriteW(&cred, 0) };
        if res != 0 {
            Ok(())
        } else {
            Err(AppError::RdpError("Fallo al registrar credencial temporal en Windows Credential Manager".into()))
        }
    }

    pub fn delete_windows_credential(target_name: &str) -> Result<(), AppError> {
        let target_wide = to_wide_null(target_name);
        let res = unsafe { CredDeleteW(target_wide.as_ptr(), CRED_TYPE_GENERIC, 0) };
        if res != 0 {
            Ok(())
        } else {
            // If already deleted or not found, consider it success (idempotent)
            Ok(())
        }
    }

    pub fn cleanup_orphaned_windows_credentials() {
        let filter_wide = to_wide_null("TERMSRV/zyntratek:*");
        let mut count: u32 = 0;
        let mut creds_ptr: *mut *mut CREDENTIALW = null_mut();

        let res = unsafe { CredEnumerateW(filter_wide.as_ptr(), 0, &mut count, &mut creds_ptr) };
        if res != 0 && !creds_ptr.is_null() {
            unsafe {
                let creds_slice = std::slice::from_raw_parts(creds_ptr, count as usize);
                for &cred_p in creds_slice {
                    if !cred_p.is_null() {
                        let target_ptr = (*cred_p).target_name;
                        if !target_ptr.is_null() {
                            CredDeleteW(target_ptr, CRED_TYPE_GENERIC, 0);
                        }
                    }
                }
                CredFree(creds_ptr as *mut std::ffi::c_void);
            }
        }
    }
}

#[cfg(target_os = "windows")]
pub use sys::*;

#[cfg(not(target_os = "windows"))]
pub fn write_windows_credential(_target: &str, _user: &str, _pass: &str) -> Result<(), crate::error::AppError> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn delete_windows_credential(_target: &str) -> Result<(), crate::error::AppError> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn cleanup_orphaned_windows_credentials() {}
