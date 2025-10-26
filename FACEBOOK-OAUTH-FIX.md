# 🔧 Facebook OAuth Connection Fix

## Problem Identified

Your Facebook App "My Ads Manager" (ID: 1515799103199853) is missing critical OAuth configuration needed for the "Connect with Facebook" button to work.

## ⚠️ Missing Configuration

1. **OAuth Redirect URIs** - Not configured
2. **Privacy Policy URL** - Not set
3. **User Support URL** - Not set
4. **App Domains** - May not include localhost

---

## 🔨 Step-by-Step Fix (5 minutes)

### Step 1: Add OAuth Redirect URIs

1. Go to: https://developers.facebook.com/apps/1515799103199853/fb-login/settings/

2. Scroll to **"Valid OAuth Redirect URIs"**

3. Add these URIs (one per line):
   ```
   http://localhost:5173/api/facebook/callback
   https://my-svelte-j91inqb3h-myles-projects-dd515697.vercel.app/api/facebook/callback
   ```

4. Click **"Save Changes"**

### Step 2: Configure Basic Settings

1. Go to: https://developers.facebook.com/apps/1515799103199853/settings/basic/

2. Scroll to **"App Domains"** and add:
   ```
   localhost
   my-svelte-j91inqb3h-myles-projects-dd515697.vercel.app
   ```

3. Add **Privacy Policy URL** (required):
   ```
   https://my-svelte-j91inqb3h-myles-projects-dd515697.vercel.app/privacy
   ```

4. Add **User Support URL** (required):
   ```
   https://my-svelte-j91inqb3h-myles-projects-dd515697.vercel.app/support
   ```

5. Click **"Save Changes"**

### Step 3: Enable Facebook Login

1. Go to: https://developers.facebook.com/apps/1515799103199853/use_cases/

2. Find **"Authenticate and request data from users" use case**

3. Click **"Customize"** or **"Edit"**

4. Make sure these permissions are added:
   - `email`
   - `public_profile`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_ads`
   - `business_management`
   - `ads_management`
   - `ads_read`

5. Click **"Save"**

### Step 4: Check Security Settings

1. Go to: https://developers.facebook.com/apps/1515799103199853/settings/advanced/

2. Scroll to **"Security"** section

3. Ensure **"Require App Secret"** is **OFF** (unchecked)

4. Click **"Save Changes"** if you made changes

### Step 5: Verify App Mode

1. At the top of the dashboard, check the mode toggle

2. For testing: Use **"Development Mode"**

3. For production: Switch to **"Live Mode"** when ready

---

## 🧪 Testing the Fix

After completing the steps above:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:5173/dashboard/ads

3. Click **"Connect with Facebook"**

4. You should see the Facebook Login dialog

5. Grant the required permissions

6. You'll be redirected back to your app

---

## 🚨 Common Issues & Solutions

### Issue: "URL Blocked: This redirect failed"
**Solution:** Make sure you added the EXACT redirect URI to Facebook App settings:
- `http://localhost:5173/api/facebook/callback` (no trailing slash)

### Issue: "App Not Set Up: This app is still in development mode"
**Solution:**
- Either add your Facebook account to App Roles > Test Users
- OR switch the app to Live Mode (requires privacy policy & terms)

### Issue: "Can't Load URL: The domain of this URL isn't included in the app's domains"
**Solution:** Add `localhost` to App Domains in Basic Settings

### Issue: "Missing Privacy Policy URL"
**Solution:** Add a privacy policy URL in Basic Settings (can be a simple placeholder page for development)

---

## 📋 Checklist

After following the guide, verify these are complete:

- [ ] OAuth Redirect URIs added (`http://localhost:5173/api/facebook/callback`)
- [ ] App Domains includes `localhost`
- [ ] Privacy Policy URL is set
- [ ] User Support URL is set
- [ ] Facebook Login use case is enabled
- [ ] Required permissions are added to the use case
- [ ] "Require App Secret" is OFF in Security settings
- [ ] App is in Development Mode (with your account as admin/tester)
- [ ] Dev server restarted
- [ ] Tested "Connect with Facebook" button

---

## 🔗 Quick Links

- **App Dashboard:** https://developers.facebook.com/apps/1515799103199853/
- **FB Login Settings:** https://developers.facebook.com/apps/1515799103199853/fb-login/settings/
- **Basic Settings:** https://developers.facebook.com/apps/1515799103199853/settings/basic/
- **Use Cases:** https://developers.facebook.com/apps/1515799103199853/use_cases/
- **Advanced Settings:** https://developers.facebook.com/apps/1515799103199853/settings/advanced/
- **App Roles:** https://developers.facebook.com/apps/1515799103199853/roles/

---

## 🎯 Expected Result

After fixing the configuration, when you click "Connect with Facebook":

1. ✅ Facebook login dialog opens
2. ✅ You see permission requests for ads management, business management, etc.
3. ✅ After approving, you're redirected back to `/dashboard/ads`
4. ✅ Your Facebook Ad Account is now connected
5. ✅ You can start creating campaigns!

---

## 💡 Need Help?

If you're still experiencing issues after following this guide:

1. Check the browser console for errors (F12)
2. Check the dev server terminal for error logs
3. Verify all redirect URIs match EXACTLY (no typos, trailing slashes, etc.)
4. Make sure you're logged into Facebook with an account that has access to the Facebook App
5. Try in an incognito/private browsing window to rule out cookie issues

---

**Last Updated:** October 26, 2025
**App ID:** 1515799103199853
**App Name:** My Ads Manager
