#!/bin/bash

echo "🚀 Installing Node.js 20 via NVM for WSL..."
echo "==========================================="

# Install NVM if not already installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "📦 Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
else
    echo "✅ NVM already installed"
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install Node.js 20
echo ""
echo "📦 Installing Node.js 20..."
nvm install 20

# Use Node.js 20
echo ""
echo "🔄 Switching to Node.js 20..."
nvm use 20

# Set as default
echo ""
echo "⚙️  Setting Node.js 20 as default..."
nvm alias default 20

# Verify installation
echo ""
echo "✅ Installation complete!"
echo "==========================================="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""
echo "🎉 Node.js 20 is now installed and active!"
echo ""
echo "Next steps:"
echo "1. Close and reopen your terminal (or run: source ~/.bashrc)"
echo "2. Run: npm install"
echo "3. Run: npm run build"
echo ""
echo "The build should now complete without deprecation warnings!"