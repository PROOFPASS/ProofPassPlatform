# ProofPass Documentation Website

This directory contains the Docusaurus documentation website for ProofPass Platform.

## 🚀 Quick Start

```bash
cd website
npm install
npm start
```

This will start a local development server at `http://localhost:3000`.

## 📦 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build the static website
- `npm run serve` - Serve the built website locally
- `npm run deploy` - Deploy to GitHub Pages (requires configuration)

## 📁 Directory Structure

```
website/
├── docs/               # Documentation markdown files
├── blog/               # Blog posts (optional)
├── src/
│   ├── css/           # Custom CSS
│   └── pages/         # Custom React pages
├── static/            # Static assets (images, etc.)
├── docusaurus.config.ts  # Docusaurus configuration
├── sidebars.ts        # Sidebar configuration
└── package.json       # Dependencies
```

## 🌐 Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Pages URL

Once deployed, the documentation will be available at:
```
https://PROOFPASS.github.io/ProofPassPlatform/
```

### Manual Deployment

To manually deploy:

```bash
npm run build
GIT_USER=<Your GitHub Username> npm run deploy
```

## 📝 Adding Documentation

1. Create a new `.md` file in the `docs/` directory
2. Add front matter at the top:
   ```markdown
   ---
   sidebar_position: 1
   ---

   # Your Title
   ```
3. Update `sidebars.ts` if needed
4. The page will be automatically included in the navigation

## 🎨 Customization

- **Theme Colors**: Edit `src/css/custom.css`
- **Navigation**: Edit `docusaurus.config.ts`
- **Sidebar**: Edit `sidebars.ts`

## 🔧 Troubleshooting

If you encounter issues:

1. Clear cache: `npm run clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: Should be >= 18.0

## 📚 Learn More

- [Docusaurus Documentation](https://docusaurus.io/)
- [Markdown Features](https://docusaurus.io/docs/markdown-features)
