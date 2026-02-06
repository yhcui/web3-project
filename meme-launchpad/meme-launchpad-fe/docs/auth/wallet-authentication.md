# Wallet Authentication

## Overview

This project implements wallet-based authentication using RainbowKit's authentication adapter. When users connect their wallet, they are automatically prompted to sign a message to authenticate with the backend API.

## Features

- ✅ **Automatic Authentication**: Triggers when wallet connects without valid auth token
- ✅ **SIWE Support**: Compatible with Sign-In with Ethereum (EIP-4361) standard
- ✅ **Token Management**: Automatic token storage and refresh
- ✅ **State Synchronization**: Seamless integration with Zustand store
- ✅ **Error Handling**: Graceful error recovery and user feedback

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  RainbowKit     │────▶│  Auth Adapter    │────▶│  Backend    │
│  ConnectButton  │     │  (SIWE Message)  │     │  API        │
└─────────────────┘     └──────────────────┘     └─────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Wallet         │     │  Zustand Store   │     │  JWT Token  │
│  (MetaMask)     │     │  (Auth State)    │     │  Storage    │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

## Implementation

### 1. Authentication Flow

1. User connects wallet via RainbowKit
2. System checks for existing auth token
3. If no valid token, requests signature challenge from API
4. User signs message in wallet
5. Signature sent to backend for verification
6. JWT token received and stored
7. All subsequent API requests include auth token

### 2. Key Components

#### Authentication Adapter (`src/lib/rainbowkit-auth.ts`)

- Implements RainbowKit's `createAuthenticationAdapter`
- Handles getNonce, createMessage, verify, and signOut
- Integrates with auth API endpoints

#### Web3Provider (`src/providers/Web3Provider.tsx`)

- Wraps app with authentication context
- Monitors wallet connection status
- Triggers authentication when needed

#### useWalletAuth Hook (`src/hooks/useWalletAuth.ts`)

- Custom hook for wallet authentication
- Provides auth status and methods
- Handles wallet switching and disconnection

#### Auth Store (`src/stores/useAuthStore.ts`)

- Manages authentication state
- Persists tokens to localStorage
- Provides global auth access

## Usage

### Basic Implementation

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWalletAuth } from '@/hooks/useWalletAuth'

function MyComponent() {
  const { isAuthenticated, user, authenticate, logout } = useWalletAuth()

  return (
    <div>
      {/* RainbowKit connect button handles wallet connection */}
      <ConnectButton />

      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.address}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={authenticate}>Authenticate</button>
      )}
    </div>
  )
}
```

### Protected Routes

```tsx
import { useAuthGuard } from '@/hooks/useWalletAuth'

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuthGuard({
    requireAuth: true,
    autoAuth: true,
  })

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please authenticate</div>

  return <div>Protected content</div>
}
```

### Manual Authentication

```tsx
import { triggerAuthentication } from '@/lib/rainbowkit-auth'
import { useSignMessage } from 'wagmi'

function ManualAuth() {
  const { signMessageAsync } = useSignMessage()

  const handleAuth = async () => {
    const success = await triggerAuthentication(address, signMessageAsync)

    if (success) {
      console.log('Authenticated!')
    }
  }

  return <button onClick={handleAuth}>Sign In</button>
}
```

## API Endpoints

### GET `/api/v1/user/sign-msg`

Retrieves the challenge message for wallet signature.

**Query Parameters:**

- `address` (string, required): Wallet address

**Response:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "Sign this message to authenticate with Coinroll",
    "nonce": "abc123",
    "expiry": 1234567890
  }
}
```

### POST `/api/v1/user/wallet-login`

Verifies signature and returns JWT token.

**Request Body:**

```json
{
  "address": "0x...",
  "signature": "0x..."
}
```

**Response:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJSUz...",
    "refreshToken": "eyJhbGciOiJSUz...",
    "user": {
      "id": 1,
      "address": "0x...",
      "username": "user123"
    }
  }
}
```

## Configuration

### Environment Variables

```env
# Enable/disable authentication (default: true)
NEXT_PUBLIC_ENABLE_AUTH=true

# API base URL
NEXT_PUBLIC_API_URL=https://api-dev.coinroll.io/api/v1

# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Disabling Authentication

To disable authentication (e.g., for development):

```env
NEXT_PUBLIC_ENABLE_AUTH=false
```

This will skip the authentication flow and allow wallet connection without signing.

## Error Handling

### Common Errors

1. **User Rejected Signature**
   - Error code: 4001
   - Handling: Show friendly message asking user to sign

2. **Invalid Signature**
   - Error code: 400
   - Handling: Retry authentication flow

3. **Token Expired**
   - Error code: 401
   - Handling: Automatic token refresh or re-authentication

4. **Network Error**
   - Handling: Retry with exponential backoff

### Error Recovery

```tsx
const { error, authenticate } = useWalletAuth()

if (error?.code === 4001) {
  // User rejected, show retry button
  return <button onClick={authenticate}>Try Again</button>
}

if (error?.status === 401) {
  // Token expired, trigger re-authentication
  authenticate()
}
```

## Security Considerations

1. **Message Signing**: Uses SIWE standard for secure message format
2. **Token Storage**: JWT stored in Zustand with localStorage persistence
3. **Token Refresh**: Automatic refresh before expiration
4. **HTTPS Only**: All API calls must use HTTPS in production
5. **Address Validation**: Wallet addresses normalized to lowercase

## Testing

### Manual Testing Steps

1. Connect wallet via RainbowKit button
2. Verify signature request appears
3. Sign the message
4. Check auth token in browser DevTools (Application > Local Storage)
5. Verify authenticated state in UI
6. Test logout functionality
7. Test wallet switching
8. Test page refresh persistence

### Automated Testing

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useWalletAuth } from '@/hooks/useWalletAuth'

describe('Wallet Authentication', () => {
  it('should authenticate when wallet connects', async () => {
    const { result } = renderHook(() => useWalletAuth())

    // Trigger authentication
    await result.current.authenticate()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toBeDefined()
    })
  })
})
```

## Troubleshooting

### Authentication not triggering

- Check `NEXT_PUBLIC_ENABLE_AUTH` is not set to `false`
- Verify API endpoints are accessible
- Check browser console for errors

### Token not persisting

- Check localStorage in browser DevTools
- Verify Zustand store persistence configuration
- Check for conflicting localStorage keys

### Signature verification failing

- Ensure message format matches backend expectations
- Verify address is correctly formatted (lowercase)
- Check signature includes '0x' prefix

## Migration Guide

### From Manual Authentication

If migrating from manual authentication:

1. Remove old authentication logic
2. Install required dependencies: `siwe`
3. Update Web3Provider with authentication wrapper
4. Replace manual sign-in buttons with RainbowKit ConnectButton
5. Update API calls to use Zustand store for tokens

### From Different Auth System

1. Map existing user data to new schema
2. Update backend to support wallet authentication
3. Migrate existing tokens to new format
4. Test with both old and new authentication methods during transition

## Best Practices

1. **Always validate authentication state before protected operations**
2. **Handle wallet switching gracefully**
3. **Provide clear user feedback during authentication**
4. **Implement proper error recovery mechanisms**
5. **Test with multiple wallet providers**
6. **Monitor authentication metrics and failures**

## Future Enhancements

- [ ] Multi-chain authentication support
- [ ] Session management improvements
- [ ] Biometric authentication integration
- [ ] Hardware wallet optimization
- [ ] Social recovery mechanisms
