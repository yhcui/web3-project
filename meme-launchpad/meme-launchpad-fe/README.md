# Next-Web3-Template

A modern, production-ready starter template for building Web3 DApps with Next.js, TypeScript, and blockchain integration.

## Features

### 🚀 Core Technologies

- **Next.js 15.3.5** - Latest App Router architecture
- **React 19** - Cutting-edge React features
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS framework

### 🔗 Web3 Integration

- **RainbowKit** - Beautiful wallet connection UI
- **wagmi** - React Hooks for Ethereum
- **viem** - TypeScript-first Ethereum library
- **BSC (Binance Smart Chain)** - Pre-configured blockchain network

### 🌍 Internationalization

- **next-intl** - Full i18n support
- English and Chinese languages included
- Path-based routing (`/en`, `/zh`)
- Easy to extend with more languages

### 🎨 UI & Components

- **Shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icon set

### 🛠 Developer Experience

- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code quality checks
- **Prettier** - Automatic code formatting
- **Husky** - Git hooks for code quality
- **Path aliases** - Clean imports with `@/`

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd next-web3-template
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure WalletConnect:
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Update `src/config/wagmi.ts` with your project ID:

   ```typescript
   const projectId = 'YOUR_PROJECT_ID'
   ```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/
│   ├── [locale]/        # Internationalized routes
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── favicon.ico
│   └── globals.css      # Global styles
├── components/
│   ├── WalletCard.tsx   # Wallet connection component
│   └── ui/              # Shadcn UI components
├── config/
│   └── wagmi.ts         # Web3 configuration
├── i18n/                # Internationalization setup
├── lib/
│   └── utils.ts         # Utility functions
├── middleware.ts        # Next.js middleware
└── providers/
    └── Web3Provider.tsx # Web3 context provider
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## Configuration

### Blockchain Networks

The template is pre-configured for BSC (Binance Smart Chain). To add more networks, edit `src/config/wagmi.ts`:

```typescript
import { mainnet, polygon, arbitrum } from 'wagmi/chains'

const config = getDefaultConfig({
  chains: [bsc, mainnet, polygon, arbitrum],
  // ...
})
```

### Adding Languages

1. Create a new translation file in `messages/` (e.g., `messages/ja.json`)
2. Update `src/i18n/routing.ts` to include the new locale
3. Add translations for all keys

### UI Components

Add new Shadcn/ui components:

```bash
pnpm dlx shadcn@latest add button
```

## Environment Variables

Create a `.env.local` file:

```env
# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Add other environment variables as needed
```

## Best Practices

1. **Type Safety**: Leverage TypeScript for all components and functions
2. **Internationalization**: Always use translation keys for user-facing text
3. **Component Library**: Use Shadcn/ui components when possible
4. **Code Quality**: Commits automatically run Prettier via Git hooks
5. **Web3 Integration**: Use wagmi hooks for blockchain interactions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

Build the project:

```bash
pnpm build
```

The output will be in the `.next` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ for the Web3 community
