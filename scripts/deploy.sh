#!/bin/bash

# Bull Horn Analytics Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🎯 Bull Horn Analytics - Production Deployment"
echo "=============================================="

# Configuration
PROJECT_NAME="bull-horn-analytics"
BUILD_DIR="dist"
BACKUP_DIR="backups"
LOG_FILE="deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the project root?"
    fi
    
    log "Prerequisites check passed ✅"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --only=production --silent
    log "Dependencies installed ✅"
}

# Run tests
run_tests() {
    log "Running tests..."
    npm run test 2>&1 | tee -a $LOG_FILE
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        error "Tests failed"
    fi
    log "Tests passed ✅"
}

# Type checking
type_check() {
    log "Running TypeScript type check..."
    npm run typecheck 2>&1 | tee -a $LOG_FILE
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        error "Type check failed"
    fi
    log "Type check passed ✅"
}

# Build application
build_app() {
    log "Building application..."
    
    # Clean previous build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf $BUILD_DIR
        log "Cleaned previous build"
    fi
    
    # Build
    npm run build 2>&1 | tee -a $LOG_FILE
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        error "Build failed"
    fi
    
    # Verify build
    if [ ! -d "$BUILD_DIR" ]; then
        error "Build directory not created"
    fi
    
    log "Build completed ✅"
}

# Optimize assets
optimize_assets() {
    log "Optimizing assets..."
    
    # Compress images (if imagemin is available)
    if command -v imagemin &> /dev/null; then
        find $BUILD_DIR -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imagemin --replace
        log "Images compressed"
    fi
    
    # Generate gzip files for better compression
    find $BUILD_DIR -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;
    log "Gzip files generated"
    
    log "Asset optimization completed ✅"
}

# Security check
security_check() {
    log "Running security audit..."
    npm audit --audit-level moderate 2>&1 | tee -a $LOG_FILE
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        warn "Security vulnerabilities found. Please review."
    else
        log "Security audit passed ✅"
    fi
}

# Bundle analysis
analyze_bundle() {
    log "Analyzing bundle size..."
    
    # Check if build directory exists
    if [ ! -d "$BUILD_DIR" ]; then
        error "Build directory not found"
    fi
    
    # Calculate total size
    TOTAL_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    JS_SIZE=$(find $BUILD_DIR -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)
    CSS_SIZE=$(find $BUILD_DIR -name "*.css" -exec du -ch {} + | tail -1 | cut -f1)
    
    log "Bundle Analysis:"
    log "  Total size: $TOTAL_SIZE"
    log "  JavaScript: $JS_SIZE"
    log "  CSS: $CSS_SIZE"
    
    # Check if bundle is too large
    TOTAL_MB=$(du -sm $BUILD_DIR | cut -f1)
    if [ $TOTAL_MB -gt 5 ]; then
        warn "Bundle size is large ($TOTAL_SIZE). Consider optimization."
    fi
    
    log "Bundle analysis completed ✅"
}

# Create deployment package
create_package() {
    log "Creating deployment package..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PACKAGE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"
    
    # Create backup directory
    mkdir -p $BACKUP_DIR
    
    # Create package
    tar -czf "$BACKUP_DIR/$PACKAGE_NAME" -C $BUILD_DIR .
    
    log "Deployment package created: $BACKUP_DIR/$PACKAGE_NAME ✅"
}

# Deploy to server (placeholder)
deploy_to_server() {
    log "Deployment to server..."
    
    # This is where you would add your specific deployment logic
    # Examples:
    # - Upload to S3/CDN
    # - Deploy to Vercel/Netlify
    # - Upload via FTP/SFTP
    # - Deploy to Docker container
    
    warn "Server deployment not configured. Please set up your deployment target."
    
    log "Server deployment placeholder completed ⚠️"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
Bull Horn Analytics - Deployment Report
=======================================

Deployment Date: $(date)
Project: $PROJECT_NAME
Build Directory: $BUILD_DIR
Bundle Size: $(du -sh $BUILD_DIR | cut -f1)

Files Deployed:
$(find $BUILD_DIR -type f | wc -l) files

Build Contents:
$(ls -la $BUILD_DIR)

Deployment Status: SUCCESS ✅

EOF
    
    log "Deployment report generated: $REPORT_FILE ✅"
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    if [ -f "npm-debug.log" ]; then
        rm npm-debug.log
    fi
    
    log "Cleanup completed ✅"
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_prerequisites
    install_dependencies
    run_tests
    type_check
    security_check
    build_app
    optimize_assets
    analyze_bundle
    create_package
    deploy_to_server
    generate_report
    cleanup
    
    echo -e "${GREEN}"
    echo "🎉 Deployment completed successfully!"
    echo "=============================================="
    echo -e "${NC}"
    
    log "Deployment process completed successfully 🎉"
}

# Run main function
main "$@"
