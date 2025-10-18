#!/bin/bash

# Script to update the frontend's Stripe publishable key
# Usage: ./update-frontend-stripe-key.sh <publishable_key>

if [ -z "$1" ]; then
    echo "Usage: $0 <publishable_key>"
    echo "Example: $0 pk_test_51H1234567890abcdef"
    exit 1
fi

PUBLISHABLE_KEY=$1
ENV_FILE="billing-frontend/.env.local"

# Check if the .env.local file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env.local file not found at $ENV_FILE"
    exit 1
fi

# Update or add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$ENV_FILE"; then
    sed -i "s/^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY/" "$ENV_FILE"
    echo "✅ Updated NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in $ENV_FILE"
else
    echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY" >> "$ENV_FILE"
    echo "✅ Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to $ENV_FILE"
fi

echo "Frontend Stripe key updated successfully!"