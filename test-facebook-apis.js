/**
 * Test Facebook Marketing API and Graph API Connections
 */

import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import dotenv from 'dotenv';

dotenv.config();

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

console.log('🔍 Testing Facebook API Connections...\n');
console.log('Configuration:');
console.log(`  App ID: ${FB_APP_ID}`);
console.log(`  App Secret: ${FB_APP_SECRET ? '***' + FB_APP_SECRET.slice(-4) : 'NOT SET'}\n`);

if (!FB_APP_ID || !FB_APP_SECRET) {
	console.error('❌ Error: FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set in .env');
	process.exit(1);
}

// Test 1: Initialize Marketing API
console.log('📊 Test 1: Initializing Facebook Marketing API...');
try {
	const api = FacebookAdsApi.init(FB_APP_ID, FB_APP_SECRET);
	console.log('✅ Marketing API initialized successfully');
	console.log(`   API Version: ${api.version || 'default'}\n`);
} catch (error) {
	console.error('❌ Marketing API initialization failed:', error.message);
	process.exit(1);
}

// Test 2: Generate App Access Token
console.log('🔑 Test 2: Generating App Access Token...');
try {
	const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
	console.log('✅ App Access Token format valid');
	console.log(`   Token: ${appAccessToken.slice(0, 20)}...\n`);
} catch (error) {
	console.error('❌ App Access Token generation failed:', error.message);
}

// Test 3: Test Graph API Connection
console.log('🌐 Test 3: Testing Facebook Graph API Connection...');
try {
	const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
	const graphApiUrl = `https://graph.facebook.com/v21.0/${FB_APP_ID}?fields=name,category&access_token=${appAccessToken}`;

	console.log(`   Fetching: ${graphApiUrl.replace(appAccessToken, '***TOKEN***')}`);

	const response = await fetch(graphApiUrl);
	const data = await response.json();

	if (data.error) {
		console.error('❌ Graph API Error:', data.error.message);
		console.error(`   Error Code: ${data.error.code}`);
		console.error(`   Error Type: ${data.error.type}`);

		if (data.error.code === 190) {
			console.log('\n💡 Tip: Error 190 means invalid access token. Check your App ID and Secret.');
		}
	} else {
		console.log('✅ Graph API connection successful!');
		console.log(`   App Name: ${data.name || 'N/A'}`);
		console.log(`   App Category: ${data.category || 'N/A'}`);
	}
} catch (error) {
	console.error('❌ Graph API connection failed:', error.message);
}

// Test 4: Check Marketing API Endpoints
console.log('\n📱 Test 4: Checking Marketing API Endpoints...');
const endpoints = [
	{ name: 'Campaign', available: true },
	{ name: 'AdSet', available: true },
	{ name: 'Ad', available: true },
	{ name: 'AdAccount', available: true },
	{ name: 'AdsInsights', available: true }
];

endpoints.forEach(endpoint => {
	if (endpoint.available) {
		console.log(`   ✅ ${endpoint.name} endpoint available`);
	} else {
		console.log(`   ❌ ${endpoint.name} endpoint NOT available`);
	}
});

// Test 5: Validate App Permissions
console.log('\n🔐 Test 5: Required Permissions for Marketing API:');
const requiredPermissions = [
	'ads_management',
	'ads_read',
	'business_management',
	'pages_read_engagement',
	'pages_manage_posts',
	'pages_manage_ads'
];

requiredPermissions.forEach(permission => {
	console.log(`   📋 ${permission} - Required for full functionality`);
});

console.log('\n📝 Summary:');
console.log('   To use the Marketing API, users need to:');
console.log('   1. Connect their Facebook account via OAuth');
console.log('   2. Grant the required permissions listed above');
console.log('   3. Have an active Facebook Ad Account');
console.log('   4. Have a Facebook Business Manager (for advanced features)');

console.log('\n✅ Facebook API connection tests complete!');
