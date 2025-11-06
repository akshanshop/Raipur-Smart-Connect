# Gmail Notification Setup Guide

This application uses Gmail to send email notifications to users about their complaint status updates. The implementation uses **Nodemailer** with Gmail SMTP, which works on any deployment platform (Replit, Heroku, AWS, Vercel, etc.).

## Required Environment Variables

You need to set two environment variables:

1. **GMAIL_USER**: Your Gmail email address (e.g., `your-email@gmail.com`)
2. **GMAIL_APP_PASSWORD**: A Gmail app-specific password (NOT your regular Gmail password)

## How to Get a Gmail App Password

Google requires you to use an **App Password** for applications that access Gmail via SMTP. Here's how to get one:

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "Signing in to Google," select **2-Step Verification**
4. Follow the steps to turn on 2-Step Verification (if not already enabled)

### Step 2: Generate an App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "Signing in to Google," select **App passwords**
   - If you don't see this option, make sure 2-Step Verification is enabled first
4. Select **Other (Custom name)** from the dropdown
5. Enter a name like "Nagar Nigam App" or "Complaint System"
6. Click **Generate**
7. Google will show you a 16-character password - **copy this immediately** (you won't be able to see it again)

### Step 3: Set Environment Variables

#### On Replit:
1. Click on "Secrets" (🔒 icon) in the left sidebar
2. Add two secrets:
   - Key: `GMAIL_USER`, Value: `your-email@gmail.com`
   - Key: `GMAIL_APP_PASSWORD`, Value: `your 16-character app password`

#### On Other Platforms:
- **Heroku**: Use `heroku config:set GMAIL_USER=your-email@gmail.com`
- **Vercel**: Add in Project Settings → Environment Variables
- **AWS/Railway/Render**: Add in their respective environment variable settings

## Testing

Once configured, the application will automatically:
- Send a welcome email when users submit a complaint
- Send status update emails when officials acknowledge, work on, or resolve complaints
- Gracefully skip email sending if credentials are not configured (with a console log message)

## Security Notes

- **Never** commit your app password to Git or share it publicly
- If you accidentally expose your app password, revoke it immediately from Google Account settings and generate a new one
- The app password is specific to this application and can be revoked without affecting your main Gmail account

## Troubleshooting

**"Gmail credentials not configured"**: Make sure both `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables are set.

**"Invalid login"**: Check that you're using an **app password**, not your regular Gmail password.

**"Less secure app access"**: You don't need to enable this - app passwords work without it.

**Emails not sending**: Check the server logs for specific error messages. Ensure 2-Step Verification is enabled on your Google account.
