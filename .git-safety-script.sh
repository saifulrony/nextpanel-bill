#!/bin/bash

# Git Safety Script for nextpanel-bill
# This script helps prevent Git corruption and provides recovery options

echo "=== Git Safety Script ==="
echo "Repository: nextpanel-bill"
echo "Date: $(date)"
echo ""

# Function to check Git health
check_git_health() {
    echo "Checking Git repository health..."
    
    # Check if .git directory exists
    if [ ! -d ".git" ]; then
        echo "❌ ERROR: .git directory not found!"
        return 1
    fi
    
    # Check for empty object files
    empty_objects=$(find .git/objects -type f -empty 2>/dev/null | wc -l)
    if [ "$empty_objects" -gt 0 ]; then
        echo "⚠️  WARNING: Found $empty_objects empty object files!"
        return 1
    fi
    
    # Test Git operations
    if ! git status >/dev/null 2>&1; then
        echo "❌ ERROR: Git status failed - repository may be corrupted!"
        return 1
    fi
    
    if ! git fsck --no-dangling >/dev/null 2>&1; then
        echo "❌ ERROR: Git fsck found issues!"
        return 1
    fi
    
    echo "✅ Git repository is healthy"
    return 0
}

# Function to backup current state
backup_repo() {
    echo "Creating backup..."
    backup_dir="../nextpanel-bill-backup-$(date +%Y%m%d_%H%M%S)"
    cp -r . "$backup_dir"
    echo "✅ Backup created: $backup_dir"
}

# Function to recover from GitHub
recover_from_github() {
    echo "Recovering from GitHub..."
    
    # Backup current state
    backup_repo
    
    # Remove corrupted .git
    rm -rf .git
    
    # Reinitialize
    git init
    git remote add origin https://github.com/saifulrony/nextpanel-bill.git
    git fetch origin
    git reset --hard origin/main
    git branch -M main
    
    echo "✅ Repository recovered from GitHub"
}

# Main execution
case "$1" in
    "check")
        check_git_health
        ;;
    "backup")
        backup_repo
        ;;
    "recover")
        recover_from_github
        ;;
    *)
        echo "Usage: $0 {check|backup|recover}"
        echo ""
        echo "Commands:"
        echo "  check   - Check Git repository health"
        echo "  backup  - Create a backup of current state"
        echo "  recover - Recover from GitHub (destructive!)"
        ;;
esac
