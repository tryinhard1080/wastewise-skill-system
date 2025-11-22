#!/bin/bash

##############################################################################
# WasteWise Rollback Script
#
# Rolls back to the previous Railway deployment.
# Can be used for both staging and production environments.
#
# Prerequisites:
#   - Railway CLI installed (npm install -g @railway/cli)
#   - Authenticated with Railway (railway login)
#
# Usage:
#   ./scripts/rollback.sh                    # Interactive rollback
#   ./scripts/rollback.sh --environment production
#   ./scripts/rollback.sh --auto             # Automatic rollback (CI/CD)
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"
AUTO_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

confirm() {
    if [ "$AUTO_MODE" = true ]; then
        return 0
    fi

    read -r -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

##############################################################################
# Pre-flight Checks
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  WasteWise Rollback"
echo "═══════════════════════════════════════════════════════"
echo ""

log_warning "You are about to rollback $ENVIRONMENT environment"
echo ""

# Check required commands
log_info "Checking prerequisites..."
check_command "railway"
log_success "Railway CLI found"

# Check if Railway is authenticated
if ! railway whoami &> /dev/null; then
    log_error "Not authenticated with Railway. Run 'railway login' first."
    exit 1
fi
log_success "Railway authentication verified"

##############################################################################
# Get Deployment History
##############################################################################

log_info "Fetching deployment history..."

# Get current deployment
CURRENT_DEPLOYMENT=$(railway status --environment "$ENVIRONMENT" 2>&1 | grep "Deployment ID" | awk '{print $NF}' || echo "unknown")

log_info "Current deployment: $CURRENT_DEPLOYMENT"

# List recent deployments (Railway CLI doesn't have a direct command for this)
# We'll use the Railway API or dashboard for this
log_info "Recent deployments:"
log_warning "Railway CLI does not provide deployment history via command line"
log_info "Please check Railway dashboard at: https://railway.app/dashboard"

echo ""
log_info "To rollback:"
echo "  1. Go to Railway dashboard"
echo "  2. Select your project"
echo "  3. Go to 'Deployments' tab"
echo "  4. Find the last known good deployment"
echo "  5. Click 'Redeploy' on that deployment"
echo ""

##############################################################################
# Alternative: Manual Rollback via Git
##############################################################################

if [ "$AUTO_MODE" = false ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "  Alternative: Git-based Rollback"
    echo "═══════════════════════════════════════════════════════"
    echo ""

    log_info "You can also rollback by reverting the git commit:"
    echo ""

    # Get recent commits
    log_info "Recent commits:"
    git log --oneline -5

    echo ""
    log_info "To rollback to a specific commit:"
    echo "  1. Identify the commit SHA from the list above"
    echo "  2. Run: git revert <commit-sha>"
    echo "  3. Push to master: git push origin master"
    echo "  4. Railway will auto-deploy the reverted code"
    echo ""

    if confirm "Do you want to perform a git-based rollback now?"; then
        echo ""
        read -r -p "Enter commit SHA to revert: " COMMIT_SHA

        if [ -z "$COMMIT_SHA" ]; then
            log_error "Commit SHA is required"
            exit 1
        fi

        log_info "Reverting commit $COMMIT_SHA..."

        if git revert "$COMMIT_SHA" --no-edit; then
            log_success "Commit reverted successfully"

            if confirm "Push reverted commit to remote?"; then
                CURRENT_BRANCH=$(git branch --show-current)

                if git push origin "$CURRENT_BRANCH"; then
                    log_success "Pushed to remote"
                    log_info "Railway will automatically deploy the rollback"
                else
                    log_error "Failed to push to remote"
                    exit 1
                fi
            else
                log_info "Rollback committed locally but not pushed"
                log_warning "Run 'git push' manually when ready"
            fi
        else
            log_error "Failed to revert commit"
            log_info "You may need to resolve conflicts manually"
            exit 1
        fi
    fi
fi

##############################################################################
# Rollback via Railway CLI (Limited)
##############################################################################

if [ "$AUTO_MODE" = true ]; then
    log_warning "Automatic rollback via Railway CLI is limited"
    log_info "Attempting to redeploy previous build..."

    # Railway doesn't have a direct rollback command
    # Best we can do is trigger a redeploy of the previous commit

    log_info "Getting previous commit..."
    PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

    log_info "Checking out previous commit: $PREVIOUS_COMMIT"

    if git checkout "$PREVIOUS_COMMIT"; then
        log_info "Deploying previous commit..."

        if railway up --environment "$ENVIRONMENT"; then
            log_success "Rollback deployment initiated"

            # Return to original branch
            git checkout -

            log_warning "Remember to create a revert commit to persist this rollback"
        else
            log_error "Rollback deployment failed"
            git checkout -
            exit 1
        fi
    else
        log_error "Failed to checkout previous commit"
        exit 1
    fi
fi

##############################################################################
# Post-rollback Verification
##############################################################################

if [ "$AUTO_MODE" = true ]; then
    log_info "Waiting for rollback deployment to complete..."
    sleep 60

    # Get production URL
    DEPLOYMENT_URL=$(railway domain --environment "$ENVIRONMENT" 2>/dev/null || echo "")

    if [ -n "$DEPLOYMENT_URL" ]; then
        log_info "Verifying health endpoint..."
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/health" || echo "000")

        if [ "$HTTP_STATUS" = "200" ]; then
            log_success "Health check passed after rollback"
        else
            log_error "Health check failed after rollback (HTTP $HTTP_STATUS)"
            log_warning "Manual intervention required"
        fi
    fi
fi

##############################################################################
# Summary
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Rollback Summary"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Environment:      $ENVIRONMENT"
echo "Previous Deploy:  $CURRENT_DEPLOYMENT"
echo "Action:           Rollback initiated"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

log_success "Rollback process completed"
echo ""
log_info "Next steps:"
echo "  1. Verify application is working correctly"
echo "  2. Check error rates in Sentry"
echo "  3. Monitor logs in Railway dashboard"
echo "  4. Investigate root cause of the issue"
echo "  5. Create a fix and test thoroughly before redeploying"
echo ""
