#!/bin/bash

##############################################################################
# WasteWise Production Deployment Script
#
# Deploys the application to Railway production environment.
# This script includes additional safety checks and confirmations.
#
# Prerequisites:
#   - Railway CLI installed (npm install -g @railway/cli)
#   - Authenticated with Railway (railway login)
#   - Production project linked (railway link)
#   - All tests passing
#   - Staging deployment verified
#
# Usage:
#   ./scripts/deploy-production.sh
#   ./scripts/deploy-production.sh --skip-confirmation  # Auto-deploy (CI/CD)
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
ENVIRONMENT="production"
REQUIRED_NODE_VERSION="20"
SKIP_CONFIRMATION=false

# Parse arguments
if [ "${1:-}" = "--skip-confirmation" ]; then
    SKIP_CONFIRMATION=true
fi

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
    if [ "$SKIP_CONFIRMATION" = true ]; then
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
echo "  WasteWise Production Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

log_warning "You are about to deploy to PRODUCTION"
echo ""

if ! confirm "Are you sure you want to continue?"; then
    log_info "Deployment cancelled"
    exit 0
fi

echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Check required commands
log_info "Checking prerequisites..."
check_command "node"
check_command "pnpm"
check_command "railway"
check_command "git"
log_success "All prerequisites found"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    log_error "Node.js version $REQUIRED_NODE_VERSION or higher is required (current: $NODE_VERSION)"
    exit 1
fi
log_success "Node.js version: $NODE_VERSION"

# Check if Railway is authenticated
if ! railway whoami &> /dev/null; then
    log_error "Not authenticated with Railway. Run 'railway login' first."
    exit 1
fi
log_success "Railway authentication verified"

# Check if on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    log_error "Production deployments must be from master/main branch (current: $CURRENT_BRANCH)"
    exit 1
fi
log_success "On correct branch: $CURRENT_BRANCH"

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    log_error "Working directory has uncommitted changes"
    git status --short
    exit 1
fi
log_success "Working directory is clean"

# Check if up to date with remote
git fetch origin "$CURRENT_BRANCH" --quiet
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH")

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    log_error "Local branch is not up to date with remote"
    log_info "Please pull latest changes: git pull origin $CURRENT_BRANCH"
    exit 1
fi
log_success "Branch is up to date with remote"

##############################################################################
# Pre-deployment Validation
##############################################################################

log_info "Running pre-deployment validation..."

# Validate environment variables
log_info "Validating environment variables (strict mode)..."
if ! pnpm validate:env --strict; then
    log_error "Environment validation failed"
    exit 1
fi
log_success "Environment variables validated"

# Run TypeScript checks
log_info "Running TypeScript checks..."
if ! pnpm tsc --noEmit; then
    log_error "TypeScript compilation errors found"
    exit 1
fi
log_success "TypeScript checks passed"

# Run linter
log_info "Running linter..."
if ! pnpm lint; then
    log_error "Linting errors found"
    exit 1
fi
log_success "Linting passed"

# Run all tests
log_info "Running all tests..."
if ! pnpm test; then
    log_error "Tests failed"
    exit 1
fi
log_success "All tests passed"

##############################################################################
# Build Application
##############################################################################

log_info "Building application..."

if ! pnpm build; then
    log_error "Build failed"
    exit 1
fi
log_success "Build completed successfully"

##############################################################################
# Final Confirmation
##############################################################################

GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_MESSAGE=$(git log -1 --pretty=%B)

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Deployment Details"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Environment:     $ENVIRONMENT"
echo "Branch:          $CURRENT_BRANCH"
echo "Git Commit:      $GIT_COMMIT"
echo "Commit Message:  $GIT_MESSAGE"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

if ! confirm "Proceed with production deployment?"; then
    log_info "Deployment cancelled"
    exit 0
fi

##############################################################################
# Create Git Tag
##############################################################################

log_info "Creating deployment tag..."

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TAG_NAME="deploy-production-$TIMESTAMP"

if git tag -a "$TAG_NAME" -m "Production deployment: $GIT_COMMIT"; then
    log_success "Created tag: $TAG_NAME"

    # Push tag to remote
    if git push origin "$TAG_NAME"; then
        log_success "Pushed tag to remote"
    else
        log_warning "Failed to push tag to remote"
    fi
else
    log_warning "Failed to create git tag (continuing anyway)"
fi

##############################################################################
# Deploy to Railway
##############################################################################

log_info "Deploying to Railway production environment..."

export RAILWAY_DEPLOYMENT_ID="$GIT_COMMIT-production"

log_info "Deployment ID: $RAILWAY_DEPLOYMENT_ID"

# Deploy to Railway
if railway up --environment production; then
    log_success "Deployment initiated successfully"
else
    log_error "Deployment failed"
    exit 1
fi

##############################################################################
# Post-deployment Verification
##############################################################################

log_info "Waiting for deployment to complete..."
sleep 60  # Wait longer for production deployment

log_info "Running post-deployment health checks..."

# Get production URL from Railway
PRODUCTION_URL=$(railway domain --environment production 2>/dev/null || echo "")

if [ -z "$PRODUCTION_URL" ]; then
    log_warning "Could not retrieve production URL automatically"
    log_info "Please verify deployment manually in Railway dashboard"
else
    log_info "Production URL: https://$PRODUCTION_URL"

    # Check health endpoint
    log_info "Checking health endpoint..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PRODUCTION_URL/api/health" || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Health check passed"
    else
        log_error "Health check failed (HTTP $HTTP_STATUS)"
        log_warning "Starting automatic rollback..."

        # Rollback on health check failure
        if [ -f "./scripts/rollback.sh" ]; then
            ./scripts/rollback.sh --auto
        else
            log_error "Rollback script not found. Please rollback manually via Railway dashboard."
        fi
        exit 1
    fi

    # Additional smoke tests
    log_info "Running smoke tests..."

    # Test landing page
    LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PRODUCTION_URL/" || echo "000")
    if [ "$LANDING_STATUS" = "200" ]; then
        log_success "Landing page is accessible"
    else
        log_error "Landing page returned HTTP $LANDING_STATUS"
    fi

    # Test API routes
    PROJECTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PRODUCTION_URL/api/projects" || echo "000")
    if [ "$PROJECTS_STATUS" = "401" ] || [ "$PROJECTS_STATUS" = "200" ]; then
        log_success "API routes are accessible"
    else
        log_warning "API routes returned HTTP $PROJECTS_STATUS"
    fi
fi

##############################################################################
# Sentry Release Tracking
##############################################################################

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
    log_info "Creating Sentry release..."

    if command -v sentry-cli &> /dev/null; then
        sentry-cli releases new "$GIT_COMMIT" || log_warning "Failed to create Sentry release"
        sentry-cli releases set-commits "$GIT_COMMIT" --auto || log_warning "Failed to set commits"
        sentry-cli releases finalize "$GIT_COMMIT" || log_warning "Failed to finalize release"
        log_success "Sentry release created"
    else
        log_warning "sentry-cli not installed, skipping release creation"
    fi
else
    log_info "Skipping Sentry release (SENTRY_AUTH_TOKEN not set)"
fi

##############################################################################
# Deployment Summary
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Production Deployment Summary"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Environment:       $ENVIRONMENT"
echo "Git Commit:        $GIT_COMMIT"
echo "Deployment ID:     $RAILWAY_DEPLOYMENT_ID"
echo "Git Tag:           $TAG_NAME"
[ -n "$PRODUCTION_URL" ] && echo "URL:               https://$PRODUCTION_URL"
echo "Deployed At:       $(date)"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

log_success "Production deployment completed successfully!"
echo ""
log_info "Next steps:"
echo "  1. Monitor error rates in Sentry"
echo "  2. Check application logs in Railway dashboard"
echo "  3. Verify key user flows manually"
echo "  4. Monitor system metrics for 30 minutes"
echo "  5. If issues arise, run: ./scripts/rollback.sh"
echo ""
