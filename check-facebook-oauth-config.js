/**
 * Check Facebook OAuth Configuration
 * Verifies redirect URIs and app settings
 */

import dotenv from 'dotenv';
dotenv.config();

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;

console.log('🔍 Checking Facebook OAuth Configuration\n');
console.log('Configuration:');
console.log(`  App ID: ${FB_APP_ID}`);
console.log(`  Public Base URL: ${PUBLIC_BASE_URL}`);
console.log(`  Expected Redirect URI: ${PUBLIC_BASE_URL}/api/facebook/callback\n`);

if (!FB_APP_ID || !FB_APP_SECRET || !PUBLIC_BASE_URL) {
	console.error('❌ Missing required environment variables');
	process.exit(1);
}

// Check Facebook App Settings
async function checkAppSettings() {
	const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;

	console.log('📱 Checking Facebook App Settings...\n');

	try {
		// Get app info
		const response = await fetch(
			`https://graph.facebook.com/v21.0/${FB_APP_ID}?fields=id,name,link,privacy_policy_url,user_support_url,restrictions&access_token=${appAccessToken}`
		);
		const data = await response.json();

		if (data.error) {
			console.error('❌ Error fetching app info:', data.error.message);
			console.error('   Error Code:', data.error.code);
			return;
		}

		console.log('✅ App Information:');
		console.log(`   Name: ${data.name}`);
		console.log(`   App ID: ${data.id}`);
		console.log(`   Privacy Policy: ${data.privacy_policy_url || 'Not set ⚠️'}`);
		console.log(`   User Support URL: ${data.user_support_url || 'Not set ⚠️'}`);

	} catch (error) {
		console.error('❌ Error:', error.message);
	}
}

console.log('🔐 OAuth Redirect URI Configuration:\n');
console.log('To fix the Facebook OAuth connection, you need to:');
console.log('\n1. Go to Facebook Developer Dashboard:');
console.log(`   https://developers.facebook.com/apps/${FB_APP_ID}/fb-login/settings/`);
console.log('\n2. Add these Valid OAuth Redirect URIs:');
console.log(`   ${PUBLIC_BASE_URL}/api/facebook/callback`);
console.log(`   http://localhost:5173/api/facebook/callback`);
console.log('   (Add both for development and production)');
console.log('\n3. Click "Save Changes"');
console.log('\n4. Under "Basic Settings", verify:');
console.log('   - App Domains: localhost, your-domain.com');
console.log('   - Privacy Policy URL is set');
console.log('   - User Support URL is set');
console.log('\n5. Under "Use Cases", ensure you have:');
console.log('   - "Authenticate and request data from users" enabled');
console.log('\n6. Under "Advanced" > "Security":');
console.log('   - "Require App Secret" should be OFF for OAuth');
console.log('\n7. App Mode:');
console.log('   - Switch to "Live" mode when ready for production');

console.log('\n');
await checkAppSettings();

console.log('\n📝 Quick Check - Required Steps:');
console.log('   ☐ Added OAuth redirect URIs in Facebook App settings');
console.log('   ☐ Set App Domains (localhost for dev, your-domain for prod)');
console.log('   ☐ Privacy Policy URL configured');
console.log('   ☐ User Support URL configured');
console.log('   ☐ App is in correct mode (Development or Live)');
console.log('   ☐ Required permissions enabled in Use Cases');

console.log('\n🔗 Useful Links:');
console.log(`   - App Dashboard: https://developers.facebook.com/apps/${FB_APP_ID}/`);
console.log(`   - FB Login Settings: https://developers.facebook.com/apps/${FB_APP_ID}/fb-login/settings/`);
console.log(`   - Basic Settings: https://developers.facebook.com/apps/${FB_APP_ID}/settings/basic/`);
console.log(`   - Use Cases: https://developers.facebook.com/apps/${FB_APP_ID}/use_cases/`);
