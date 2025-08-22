#!/bin/bash

# GitHub CLI Setup Script
echo "Setting up GitHub CLI with OAuth authentication..."

# Add GitHub CLI to PATH for current session
export PATH="$PWD/gh_2.46.0_linux_amd64/bin:$PATH"

# Create an alias for easier access
alias gh="$PWD/gh_2.46.0_linux_amd64/bin/gh"

# Function to add GitHub CLI to bashrc for permanent access
setup_permanent_gh() {
    echo "Adding GitHub CLI to your .bashrc for permanent access..."
    echo "" >> ~/.bashrc
    echo "# GitHub CLI" >> ~/.bashrc
    echo "export PATH=\"$PWD/gh_2.46.0_linux_amd64/bin:\$PATH\"" >> ~/.bashrc
    echo "GitHub CLI added to PATH permanently!"
}

# Check if user wants permanent installation
echo "Do you want to add GitHub CLI to your PATH permanently? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    setup_permanent_gh
fi

# Start GitHub OAuth authentication
echo ""
echo "Starting GitHub OAuth authentication..."
echo "A browser window will open for you to authenticate with GitHub."
echo ""
./gh_2.46.0_linux_amd64/bin/gh auth login --web

# Verify authentication
echo ""
echo "Verifying authentication status..."
./gh_2.46.0_linux_amd64/bin/gh auth status

echo ""
echo "Setup complete! You can now use GitHub CLI commands."
echo ""
echo "Example commands:"
echo "  gh repo list                    # List your repositories"
echo "  gh pr list                       # List pull requests"
echo "  gh issue list                    # List issues"
echo "  gh repo clone owner/repo         # Clone a repository"
echo ""
echo "Docker is already installed and ready to use!"
echo "Docker version:"
docker --version