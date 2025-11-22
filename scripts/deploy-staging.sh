#!/bin/bash

##############################################################################
# WasteWise Staging Deployment Script
#
# Deploys the application to Railway staging environment.
# This script should be run from the project root directory.
#
# Prerequisites:
#   - Railway CLI installed (npm install -g @railway/cli)
#   - Authenticated with Railway (railway login)
#   - Staging project linked (railway link)
#
# Usage:
#   ./scripts/deploy-staging.sh
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
ENVIRONMENT="staging"
REQUIRED_NODE_VERSION="20"

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

##############################################################################
# Pre-flight Checks
##############################################################################

log_info "Starting WasteWise staging deployment..."
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

##############################################################################
# Pre-deployment Validation
##############################################################################

log_info "Running pre-deployment validation..."

# Validate environment variables
log_info "Validating environment variables..."
if ! pnpm validate:env; then
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

# Run unit tests
log_info "Running unit tests..."
if ! pnpm test:unit; then
    log_error "Unit tests failed"
    exit 1
fi
log_success "Unit tests passed"

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
# Deploy to Railway
##############################################################################

log_info "Deploying to Railway staging environment..."

# Get current git commit SHA
GIT_COMMIT=$(git rev-parse --short HEAD)
export RAILWAY_DEPLOYMENT_ID="$GIT_COMMIT-staging"

log_info "Deployment ID: $RAILWAY_DEPLOYMENT_ID"

# Deploy to Railway
if railway up --environment staging; then
    log_success "Deployment initiated successfully"
else
    log_error "Deployment failed"
    exit 1
fi

##############################################################################
# Post-deployment Verification
##############################################################################

log_info "Waiting for deployment to complete..."
sleep 30  # Wait for Railway to finish deployment

log_info "Running post-deployment health checks..."

# Get staging URL from Railway
STAGING_URL=$(railway domain --environment staging 2>/dev/null || echo "")

if [ -z "$STAGING_URL" ]; then
    log_warning "Could not retrieve staging URL automatically"
    log_info "Please verify deployment manually in Railway dashboard"
else
    log_info "Staging URL: https://$STAGING_URL"

    # Check health endpoint
    log_info "Checking health endpoint..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$STAGING_URL/api/health" || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Health check passed"
    else
        log_error "Health check failed (HTTP $HTTP_STATUS)"
        log_warning "Deployment may still be in progress. Check Railway dashboard."
    fi
fi

##############################################################################
# Deployment Summary
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Staging Deployment Summary"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Environment:    $ENVIRONMENT"
echo "Git Commit:     $GIT_COMMIT"
echo "Deployment ID:  $RAILWAY_DEPLOYMENT_ID"
[ -n "$STAGING_URL" ] && echo "URL:            https://$STAGING_URL"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

log_success "Staging deployment completed successfully!"
echo ""
log_info "Next steps:"
echo "  1. Verify deployment in Railway dashboard"
echo "  2. Run smoke tests against staging environment"
echo "  3. Perform manual QA testing"
echo "  4. If all tests pass, deploy to production"
echo ""
