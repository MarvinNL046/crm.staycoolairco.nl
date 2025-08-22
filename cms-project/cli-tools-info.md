# CLI Tools Setup Information

## GitHub CLI OAuth Setup

**Your one-time code is: 5BC3-00AF**

To complete the GitHub authentication:
1. Open your browser and go to: https://github.com/login/device
2. Enter the code: 5BC3-00AF
3. Authorize the GitHub CLI application

## Docker CLI Status
✅ Docker is already installed and ready to use!
- Version: Docker version 28.3.3, build 980b856

## GitHub CLI Status
✅ GitHub CLI has been downloaded and is ready to use!
- Version: gh version 2.46.0
- Location: ./gh_2.46.0_linux_amd64/bin/gh

## Quick Commands

### GitHub CLI Commands:
```bash
# Use GitHub CLI from current directory
./gh_2.46.0_linux_amd64/bin/gh auth status    # Check auth status
./gh_2.46.0_linux_amd64/bin/gh repo list      # List your repos
./gh_2.46.0_linux_amd64/bin/gh pr list        # List pull requests
./gh_2.46.0_linux_amd64/bin/gh issue list     # List issues
```

### Docker Commands:
```bash
docker --version               # Check Docker version
docker ps                      # List running containers
docker images                  # List Docker images
docker run hello-world         # Test Docker installation
```

## Make GitHub CLI Permanent

To add GitHub CLI to your system PATH permanently, run:
```bash
echo 'export PATH="'$PWD'/gh_2.46.0_linux_amd64/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Then you can use `gh` command directly instead of the full path.