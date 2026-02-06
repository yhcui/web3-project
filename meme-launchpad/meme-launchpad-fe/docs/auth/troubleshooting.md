# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue: "哎呀，出了点问题！" (Oops, something went wrong!)

This error typically occurs when the authentication adapter fails to get the signature message from the API.

#### Diagnosis Steps

1. **Open Browser Console (F12)**
   - Look for messages prefixed with `[Auth]`
   - Check for any network errors or CORS issues

2. **Check API Connectivity**

   ```javascript
   // Run this in browser console to test API
   fetch(
     'https://api-dev.coinroll.io/api/v1/user/sign-msg?address=0x7f53be9fd432bd2dc936b06cc986986aacc55cde'
   )
     .then((r) => r.json())
     .then(console.log)
     .catch(console.error)
   ```

3. **Verify Environment Variables**
   - Check `.env.local` file exists
   - Ensure `NEXT_PUBLIC_API_URL` is set correctly
   - Restart dev server after changing env vars

#### Solutions Applied

1. **Enhanced Error Handling**
   - Added fallback messages when API fails
   - Improved address detection from multiple sources
   - Added detailed console logging

2. **Flexible Message Format**
   - Support both SIWE and custom message formats
   - Handle API response variations
   - Provide default messages on failure

3. **Better Address Resolution**
   - Try `eth_accounts` first
   - Fallback to `selectedAddress`
   - Extract from message if needed

### Issue: Signature Verification Fails

#### Possible Causes

1. **Address Mismatch**
   - Wallet address case sensitivity
   - Address not properly extracted from message

2. **Signature Format**
   - Missing `0x` prefix
   - Invalid signature encoding

3. **API Issues**
   - Backend not recognizing signature
   - Message format mismatch

#### Solutions

- Normalize addresses to lowercase
- Ensure signature has `0x` prefix
- Log all data for debugging

### Issue: Token Not Persisting

#### Check Points

1. **LocalStorage**

   ```javascript
   // Check in console
   localStorage.getItem('auth-storage')
   ```

2. **Zustand Store**

   ```javascript
   // Check store state
   import { useAuthStore } from '@/stores/useAuthStore'
   console.log(useAuthStore.getState())
   ```

3. **API Headers**
   - Check Network tab for Authorization header
   - Verify token format: `Bearer <token>`

## Debug Mode

To enable detailed debugging:

1. **Set Debug Environment**

   ```env
   NEXT_PUBLIC_DEBUG_AUTH=true
   ```

2. **Monitor Console Logs**
   - `[Auth]` - Authentication flow
   - `[Auth API]` - API requests
   - `[Auth Store]` - State management

3. **Test Endpoints Manually**

   ```bash
   # Test sign message endpoint
   curl "https://api-dev.coinroll.io/api/v1/user/sign-msg?address=0x7f53be9fd432bd2dc936b06cc986986aacc55cde"

   # Test login endpoint
   curl -X POST "https://api-dev.coinroll.io/api/v1/user/wallet-login" \
     -H "Content-Type: application/json" \
     -d '{"address":"0x...","signature":"0x..."}'
   ```

## Testing Steps

1. **Clear All Data**

   ```javascript
   // Run in console
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Test Authentication Flow**
   - Navigate to `/test-auth` page
   - Open browser console
   - Click "Connect Wallet"
   - Watch console for debug messages
   - Sign the message when prompted
   - Verify authentication status

3. **Check Each Step**
   - ✅ Wallet connects
   - ✅ Address is detected
   - ✅ Sign message API called
   - ✅ Message is displayed
   - ✅ Signature is created
   - ✅ Login API called
   - ✅ Token is stored
   - ✅ Auth status updates

## CORS Issues

If you see CORS errors:

1. **Development Solution**
   - Use proxy in `next.config.js`
   - Or use browser extension to disable CORS

2. **Production Solution**
   - Ensure API allows your domain
   - Check API CORS headers

## Network Issues

1. **Check API Status**

   ```bash
   curl -I https://api-dev.coinroll.io/api/v1/user/sign-msg
   ```

2. **Test with Different Networks**
   - Try both BSC Mainnet and Testnet
   - Check if issue is network-specific

3. **Firewall/VPN**
   - Disable VPN temporarily
   - Check firewall settings

## Recovery Steps

If authentication is completely broken:

1. **Reset Everything**

   ```javascript
   // Clear all auth data
   localStorage.removeItem('auth-storage')
   localStorage.removeItem('ui-storage')
   window.location.reload()
   ```

2. **Use Fallback Mode**

   ```env
   # Disable auth temporarily
   NEXT_PUBLIC_ENABLE_AUTH=false
   ```

3. **Manual Authentication**

   ```javascript
   // Bypass RainbowKit and test directly
   import { triggerAuthentication } from '@/lib/rainbowkit-auth'
   import { useSignMessage } from 'wagmi'

   const { signMessageAsync } = useSignMessage()
   await triggerAuthentication(address, signMessageAsync)
   ```

## Contact Support

If issues persist after trying these solutions:

1. Collect debug logs from browser console
2. Note the exact error message
3. Record wallet type and version
4. Document network (Mainnet/Testnet)
5. Contact development team with details
