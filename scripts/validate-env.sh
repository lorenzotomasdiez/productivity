#!/bin/bash

# Environment Variables Validation Script
# This script ensures all .env.example files have consistent variable sets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to extract variable names from .env file
extract_vars() {
    local file="$1"
    if [ -f "$file" ]; then
        grep -E '^[A-Z_][A-Z0-9_]*=' "$file" | cut -d'=' -f1 | sort
    else
        echo ""
    fi
}

# Function to compare two variable sets
compare_vars() {
    local file1="$1"
    local file2="$2"
    local vars1="$3"
    local vars2="$4"
    
    echo "Comparing $file1 vs $file2..."
    
    # Find variables in file1 but not in file2
    local missing_in_2=$(comm -23 <(echo "$vars1") <(echo "$vars2"))
    if [ -n "$missing_in_2" ]; then
        print_warning "Variables in $file1 but missing in $file2:"
        echo "$missing_in_2" | sed 's/^/  - /'
    fi
    
    # Find variables in file2 but not in file1
    local missing_in_1=$(comm -13 <(echo "$vars1") <(echo "$vars2"))
    if [ -n "$missing_in_1" ]; then
        print_warning "Variables in $file2 but missing in $file1:"
        echo "$missing_in_1" | sed 's/^/  - /'
    fi
    
    # Find common variables
    local common=$(comm -12 <(echo "$vars1") <(echo "$vars2"))
    if [ -n "$common" ]; then
        print_status "Common variables: $(echo "$common" | wc -l | tr -d ' ')"
    fi
}

# Main validation
main() {
    print_status "Starting environment variables validation..."
    
    # Define files to check
    local api_env="backend/api/.env.example"
    local docker_env="docker/development/.env.example"
    local prod_env=".env.production.example"
    
    # Check if files exist
    if [ ! -f "$api_env" ]; then
        print_error "Missing $api_env"
        exit 1
    fi
    
    if [ ! -f "$docker_env" ]; then
        print_error "Missing $docker_env"
        exit 1
    fi
    
    if [ ! -f "$prod_env" ]; then
        print_error "Missing $prod_env"
        exit 1
    fi
    
    # Extract variables from each file
    print_status "Extracting variables from $api_env..."
    local api_vars=$(extract_vars "$api_env")
    local api_count=$(echo "$api_vars" | wc -l | tr -d ' ')
    print_status "Found $api_count variables in $api_env"
    
    print_status "Extracting variables from $docker_env..."
    local docker_vars=$(extract_vars "$docker_env")
    local docker_count=$(echo "$docker_vars" | wc -l | tr -d ' ')
    print_status "Found $docker_count variables in $docker_env"
    
    print_status "Extracting variables from $prod_env..."
    local prod_vars=$(extract_vars "$prod_env")
    local prod_count=$(echo "$prod_vars" | wc -l | tr -d ' ')
    print_status "Found $prod_count variables in $prod_env"
    
    echo ""
    
    # Compare API vs Docker
    compare_vars "$api_env" "$docker_env" "$api_vars" "$docker_vars"
    
    echo ""
    
    # Compare API vs Production
    compare_vars "$api_env" "$prod_env" "$api_vars" "$prod_vars"
    
    echo ""
    
    # Summary
    print_status "Validation complete!"
    print_status "API: $api_count variables"
    print_status "Docker: $docker_count variables"
    print_status "Production: $prod_count variables"
    
    # Check for critical variables
    local critical_vars=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "REDIS_URL")
    local missing_critical=0
    
    for var in "${critical_vars[@]}"; do
        if ! echo "$api_vars" | grep -q "^$var$"; then
            print_error "Critical variable $var missing from $api_env"
            missing_critical=$((missing_critical + 1))
        fi
    done
    
    if [ $missing_critical -eq 0 ]; then
        print_status "All critical variables present ✓"
    else
        print_error "Missing $missing_critical critical variables"
        exit 1
    fi
}

# Run main function
main "$@"
