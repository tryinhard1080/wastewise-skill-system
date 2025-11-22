#!/bin/bash

###############################################################################
# WasteWise PR Cleanup Automation Script
# 
# This script uses GitHub CLI (gh) to automate PR management
# 
# Prerequisites:
# 1. GitHub CLI installed: https://cli.github.com/
# 2. Authenticated: Run `gh auth login` first
# 3. Run from your wastewise-skill-system repository directory
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    WasteWise PR Cleanup Automation Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if gh is installed
# Check if gh is installed
if ! gh --version > /dev/null 2>&1; then
    if ! gh.exe --version > /dev/null 2>&1; then
        echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
        echo "DEBUG: PATH=$PATH"
        echo ""
        echo "Install it from: https://cli.github.com/"
        echo ""
        echo "Or use:"
        echo "  macOS:   brew install gh"
        echo "  Windows: winget install --id GitHub.cli"
        echo "  Linux:   sudo apt install gh"
        exit 1
    else
        # Define alias to use gh.exe
        gh() {
            gh.exe "$@"
        }
    fi
fi

# Check if authenticated
if ! gh auth status > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"
echo ""

# Function to list all open PRs
list_prs() {
    echo -e "${BLUE}📊 Fetching all open PRs...${NC}"
    echo ""
    gh pr list --state open --json number,title,headRefName,updatedAt,statusCheckRollup
}

# Function to show PR status
show_pr_status() {
    local pr_number=$1
    echo ""
    echo -e "${BLUE}🔍 PR #${pr_number} Status:${NC}"
    gh pr view $pr_number --json title,state,statusCheckRollup,mergeable,number,headRefName | \
        jq -r '"Title: \(.title)\nBranch: \(.headRefName)\nState: \(.state)\nMergeable: \(.mergeable)\nChecks: \(.statusCheckRollup.state // "No checks")"'
}

# Function to close PR and delete branch
close_pr() {
    local pr_number=$1
    local branch_name=$2
    
    echo ""
    echo -e "${YELLOW}❌ Closing PR #${pr_number}...${NC}"
    
    # Close the PR
    gh pr close $pr_number --comment "Closing this PR - no longer needed." || true
    
    # Delete the remote branch
    echo -e "${YELLOW}🗑️  Deleting branch: ${branch_name}${NC}"
    git push origin --delete $branch_name 2>/dev/null || echo "Branch already deleted or doesn't exist"
    
    # Delete local branch if it exists
    git branch -D $branch_name 2>/dev/null || echo "Local branch doesn't exist"
    
    echo -e "${GREEN}✅ PR #${pr_number} closed and branch deleted${NC}"
}

# Function to merge PR
merge_pr() {
    local pr_number=$1
    local branch_name=$2
    
    echo ""
    echo -e "${GREEN}✅ Merging PR #${pr_number}...${NC}"
    
    # Squash and merge
    gh pr merge $pr_number --squash --delete-branch --admin || {
        echo -e "${RED}❌ Failed to merge PR #${pr_number}${NC}"
        echo "You may need to resolve conflicts or check PR status"
        return 1
    }
    
    echo -e "${GREEN}✅ PR #${pr_number} merged and branch deleted${NC}"
}

# Function to check if all checks passed
checks_passed() {
    local pr_number=$1
    local status=$(gh pr view $pr_number --json statusCheckRollup --jq '.statusCheckRollup.state')
    
    if [ "$status" == "SUCCESS" ]; then
        return 0
    else
        return 1
    fi
}

###############################################################################
# MAIN SCRIPT
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: List All Open PRs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get all open PRs
PR_LIST=$(gh pr list --state open --json number,title,headRefName,statusCheckRollup --jq '.[] | "\(.number)|\(.title)|\(.headRefName)|\(.statusCheckRollup | if type=="array" then (map(.conclusion // .state) | if any(. == "FAILURE") then "FAILURE" else "SUCCESS" end) else "PENDING" end)"')

if [ -z "$PR_LIST" ]; then
    echo -e "${GREEN}✅ No open PRs found! Repository is clean.${NC}"
    exit 0
fi

# Display PRs in a nice format
echo ""
printf "%-8s %-50s %-40s %-15s\n" "PR #" "TITLE" "BRANCH" "STATUS"
echo "────────────────────────────────────────────────────────────────────────────────────────────────────────────────"

while IFS='|' read -r number title branch status; do
    if [ "$status" == "SUCCESS" ]; then
        status_display="${GREEN}✅ PASSING${NC}"
    elif [ "$status" == "FAILURE" ]; then
        status_display="${RED}❌ FAILING${NC}"
    else
        status_display="${YELLOW}⏳ PENDING${NC}"
    fi
    
    # Truncate long titles
    if [ ${#title} -gt 48 ]; then
        title="${title:0:45}..."
    fi
    
    # Truncate long branch names
    if [ ${#branch} -gt 38 ]; then
        branch="${branch:0:35}..."
    fi
    
    printf "%-8s %-50s %-40s " "$number" "$title" "$branch"
    echo -e "$status_display"
done <<< "$PR_LIST"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Interactive PR Management${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Ask user what to do
echo "Choose an option:"
echo ""
echo "  1) Auto-close all test PRs (test/* branches)"
echo "  2) Auto-merge all passing PRs"
echo "  3) Interactive mode (choose action for each PR)"
echo "  4) Close specific PR by number"
echo "  5) Merge specific PR by number"
echo "  6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Closing all test PRs...${NC}"
        while IFS='|' read -r number title branch status; do
            if [[ $branch == test/* ]]; then
                close_pr $number $branch
            fi
        done <<< "$PR_LIST"
        echo -e "${GREEN}✅ All test PRs closed${NC}"
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}Merging all passing PRs...${NC}"
        while IFS='|' read -r number title branch status; do
            if [ "$status" == "SUCCESS" ]; then
                echo ""
                echo -e "${BLUE}PR #${number}: ${title}${NC}"
                read -p "Merge this PR? (y/n): " confirm
                if [ "$confirm" == "y" ]; then
                    merge_pr $number $branch
                fi
            fi
        done <<< "$PR_LIST"
        echo -e "${GREEN}✅ Completed merging PRs${NC}"
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}Interactive mode...${NC}"
        while IFS='|' read -r number title branch status; do
            echo ""
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${BLUE}PR #${number}: ${title}${NC}"
            echo -e "Branch: ${branch}"
            echo -e "Status: ${status}"
            show_pr_status $number
            echo ""
            echo "What do you want to do?"
            echo "  m) Merge"
            echo "  c) Close"
            echo "  s) Skip"
            echo "  q) Quit"
            echo ""
            read -p "Choice (m/c/s/q): " action
            
            case $action in
                m)
                    merge_pr $number $branch
                    ;;
                c)
                    close_pr $number $branch
                    ;;
                s)
                    echo "Skipped PR #${number}"
                    ;;
                q)
                    echo "Exiting..."
                    break
                    ;;
                *)
                    echo "Invalid choice, skipping..."
                    ;;
            esac
        done <<< "$PR_LIST"
        ;;
        
    4)
        read -p "Enter PR number to close: " pr_num
        branch=$(gh pr view $pr_num --json headRefName --jq '.headRefName')
        close_pr $pr_num $branch
        ;;
        
    5)
        read -p "Enter PR number to merge: " pr_num
        branch=$(gh pr view $pr_num --json headRefName --jq '.headRefName')
        merge_pr $pr_num $branch
        ;;
        
    6)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ PR Cleanup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Clean up local repository
echo -e "${BLUE}🧹 Cleaning up local repository...${NC}"
git checkout master 2>/dev/null || git checkout main 2>/dev/null
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null
git fetch --prune

echo ""
echo -e "${GREEN}✅ All done! Repository is clean.${NC}"
