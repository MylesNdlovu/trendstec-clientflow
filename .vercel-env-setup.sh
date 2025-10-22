#!/bin/bash
# Add Facebook environment variables to Vercel

echo "Adding FACEBOOK_APP_ID to Vercel..."
echo "1515799103199853" | vercel env add FACEBOOK_APP_ID production preview development

echo "Adding FACEBOOK_APP_SECRET to Vercel..."
echo "5e4f2aa433971f360c526f8289c60dc6" | vercel env add FACEBOOK_APP_SECRET production preview development

echo "Adding PUBLIC_BASE_URL to Vercel..."
echo "https://my-svelte-app.vercel.app" | vercel env add PUBLIC_BASE_URL production preview development

echo "✅ Environment variables added!"
echo "Now redeploying to production..."
vercel --prod
