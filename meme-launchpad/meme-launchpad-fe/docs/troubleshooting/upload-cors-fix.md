# File Upload CORS/SSL Error Fix

## Issue Description

When uploading token logos or banners, users encountered the following errors:

1. `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` when PUT request to Cloudflare storage
2. `TypeError: Failed to fetch` at uploadToPresignedUrl
3. Missing translation key for `createToken.errors.uploadFailed`

## Root Causes

1. **CORS/SSL Issue**: Direct browser uploads to Cloudflare storage were being blocked due to CORS restrictions or SSL/TLS configuration mismatches
2. **Missing Translations**: Error message translations were not defined in the i18n files
3. **Inadequate Error Handling**: Upload errors were not being caught and handled gracefully

## Fixes Applied

### 1. Enhanced Error Handling in Upload Functions

Updated `src/api/endpoints/file/mutations.ts`:

- Added try-catch blocks around upload operations
- Improved error messages with more context
- Added specific handling for CORS/network errors
- Included fallback error messages for better UX

### 2. Added Missing Translations

Updated translation files:

- **English** (`messages/en.json`): Added `errors` section with upload failure messages
- **Chinese** (`messages/zh.json`): Added corresponding Chinese translations
- Added `uploading` status message for better user feedback

### 3. Improved Upload Request Configuration

- Explicitly set `mode: 'cors'` in fetch requests
- Added proper header handling for upload requests
- Included validation for presigned URL responses
- Added detailed error logging for debugging

## Recommended Backend Changes

To fully resolve the CORS issue, the backend should:

1. **Configure CORS on Cloudflare Storage**:

   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

2. **Ensure Presigned URLs Include CORS Headers**:
   The presigned URL generation should include appropriate CORS headers in the response.

3. **Alternative: Implement Proxy Upload Endpoint**:
   Create a backend endpoint that accepts file uploads and forwards them to Cloudflare:
   ```
   POST /api/v1/file/proxy-upload
   ```
   This avoids CORS issues by uploading through the backend.

## Testing

To test the fixes:

1. Clear browser cache and cookies
2. Try uploading a logo image (< 5MB, JPEG/PNG/GIF)
3. Try uploading a banner image (< 10MB, JPEG/PNG)
4. Check browser console for any remaining errors
5. Verify uploaded images display correctly

## Future Improvements

1. **Implement Proxy Upload**: Add a backend proxy endpoint as a fallback when direct uploads fail
2. **Add Progress Tracking**: Show upload progress percentage to users
3. **Image Optimization**: Automatically compress/resize images before upload
4. **Retry Logic**: Implement automatic retry with exponential backoff
5. **CDN Integration**: Use a CDN for faster image delivery

## Related Files

- `src/api/endpoints/file/mutations.ts` - Upload logic
- `src/api/schemas/file.schema.ts` - Validation schemas
- `src/components/create-token/hooks/useTokenForm.ts` - Form integration
- `messages/en.json` - English translations
- `messages/zh.json` - Chinese translations
