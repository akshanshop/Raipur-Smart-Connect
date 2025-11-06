# SendGrid Email Notification Setup Guide

This application uses SendGrid to send email notifications to users about their complaint status updates. SendGrid is a reliable, cloud-based email delivery service that works perfectly on Render, Vercel, AWS, and other deployment platforms.

## Required Environment Variables

You need to set two required environment variables:

1. **SENDGRID_API_KEY** (required): Your SendGrid API key with "Mail Send" permissions
2. **SENDGRID_FROM_EMAIL** (required): The verified sender email address from your SendGrid account

## How to Get a SendGrid API Key

### Step 1: Create a SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up for a free account (allows up to 100 emails/day)
3. Verify your email address

### Step 2: Generate an API Key

1. Log in to SendGrid at https://app.sendgrid.com/
2. Go to **Settings** → **API Keys** (or visit https://app.sendgrid.com/settings/api_keys)
3. Click **Create API Key**
4. Enter a name like "Nagar Nigam App" or "Complaint System"
5. Select **Restricted Access**
6. Under **Mail Send**, toggle it to **Full Access**
7. Click **Create & View**
8. **Copy the API key immediately** - you won't be able to see it again!

### Step 3: Verify Sender Identity (Important!)

SendGrid requires you to verify your sender email address:

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details and use an email you have access to
4. Check your email and click the verification link
5. Use this verified email as your `SENDGRID_FROM_EMAIL` (or leave it as default)

### Step 4: Set Environment Variables

#### On Replit:
1. Click on "Secrets" (🔒 icon) in the left sidebar
2. Add two secrets:
   - Key: `SENDGRID_API_KEY`, Value: `your-sendgrid-api-key`
   - Key: `SENDGRID_FROM_EMAIL`, Value: `your-verified-email@example.com` (must match verified sender in SendGrid)

#### On Render:
1. Go to your service dashboard
2. Navigate to **Environment** tab
3. Add environment variables:
   - `SENDGRID_API_KEY` = `your-sendgrid-api-key`
   - `SENDGRID_FROM_EMAIL` = `your-verified-email@example.com` (must match verified sender in SendGrid)

#### On Other Platforms:
- **Vercel**: Add in Project Settings → Environment Variables
- **Heroku**: Use `heroku config:set SENDGRID_API_KEY=your-key`
- **AWS/Railway**: Add in their respective environment variable settings

## Testing

Once configured, the application will automatically:
- Send a welcome email when users submit a complaint
- Send status update emails when officials acknowledge, work on, or resolve complaints
- Gracefully skip email sending if the API key is not configured (with a console log message)

## Email Templates

The application includes professionally designed HTML email templates for:
- ✅ **Complaint Submitted** - Confirmation with ticket number
- 👁️ **Complaint Acknowledged** - Officials are reviewing the issue
- 🚧 **Complaint In Progress** - Work has begun
- ✨ **Complaint Resolved** - Issue successfully resolved

## Security Notes

- **Never** commit your API key to Git or share it publicly
- If you accidentally expose your API key, delete it from SendGrid settings and generate a new one
- The API key should have only "Mail Send" permissions (not full account access)
- SendGrid provides IP access management and other security features in their dashboard

## Troubleshooting

**"SendGrid API key not configured"**: Make sure the `SENDGRID_API_KEY` environment variable is set.

**"403 Forbidden"**: Your API key doesn't have Mail Send permissions. Create a new key with the correct permissions.

**"400 Bad Request - sender not verified"**: You need to verify your sender email address in SendGrid settings (see Step 3).

**Emails going to spam**: 
- Make sure you've verified your domain or single sender
- Consider setting up domain authentication (DKIM, SPF) in SendGrid settings
- Avoid using generic sender addresses like noreply@ for better deliverability

**Rate limits exceeded**: Free tier allows 100 emails/day. Upgrade your SendGrid plan if needed.

## Free Tier Limits

SendGrid free tier includes:
- 100 emails per day
- Full access to email APIs
- Email activity tracking
- Basic email validation

For production deployments with higher volume, consider upgrading to a paid plan.
