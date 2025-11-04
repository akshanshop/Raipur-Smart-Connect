import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    const accessToken = connectionSettings.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
    if (accessToken) {
      return accessToken;
    }
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export type NotificationType = 
  | 'complaint_submitted' 
  | 'complaint_acknowledged' 
  | 'complaint_in_progress' 
  | 'complaint_resolved';

const emailTemplates: Record<NotificationType, (ticketNumber: string, title: string, userName?: string) => { subject: string; html: string }> = {
  complaint_submitted: (ticketNumber, title, userName) => ({
    subject: `✅ Complaint Submitted - Ticket #${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .ticket { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Nagar Nigam Complaint System</h1>
          </div>
          <div class="content">
            <h2>Hello${userName ? ' ' + userName : ''}!</h2>
            <p>Your complaint has been submitted successfully to the Nagar Nigam.</p>
            
            <div class="ticket">
              <strong>Ticket Number:</strong> ${ticketNumber}<br>
              <strong>Title:</strong> ${title}
            </div>
            
            <p>We will update you on the progress via email and SMS.</p>
            <p>Thank you for helping make your city better! 🌟</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nagar Nigam Complaint System.</p>
            <p>&copy; 2025 Smart City Initiative</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  complaint_acknowledged: (ticketNumber, title, userName) => ({
    subject: `👁️ Complaint Acknowledged - Ticket #${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .ticket { background-color: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Nagar Nigam Complaint System</h1>
          </div>
          <div class="content">
            <h2>Good news${userName ? ', ' + userName : ''}!</h2>
            <p>Nagar Nigam officials have acknowledged your complaint and are reviewing the issue.</p>
            
            <div class="ticket">
              <strong>Ticket Number:</strong> ${ticketNumber}<br>
              <strong>Title:</strong> ${title}<br>
              <strong>Status:</strong> Under Review
            </div>
            
            <p>We will notify you when work begins on resolving this issue.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nagar Nigam Complaint System.</p>
            <p>&copy; 2025 Smart City Initiative</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  complaint_in_progress: (ticketNumber, title, userName) => ({
    subject: `🚧 Complaint In Progress - Ticket #${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .ticket { background-color: #ede9fe; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Nagar Nigam Complaint System</h1>
          </div>
          <div class="content">
            <h2>Excellent update${userName ? ', ' + userName : ''}!</h2>
            <p>Your issue is now being actively resolved by our officials.</p>
            
            <div class="ticket">
              <strong>Ticket Number:</strong> ${ticketNumber}<br>
              <strong>Title:</strong> ${title}<br>
              <strong>Status:</strong> Work In Progress 🚧
            </div>
            
            <p>We will notify you once the issue has been resolved.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nagar Nigam Complaint System.</p>
            <p>&copy; 2025 Smart City Initiative</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  complaint_resolved: (ticketNumber, title, userName) => ({
    subject: `✨ Complaint Resolved - Ticket #${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .ticket { background-color: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Nagar Nigam Complaint System</h1>
          </div>
          <div class="content">
            <h2>Great news${userName ? ', ' + userName : ''}! 🎉</h2>
            <p>Your complaint has been successfully resolved.</p>
            
            <div class="ticket">
              <strong>Ticket Number:</strong> ${ticketNumber}<br>
              <strong>Title:</strong> ${title}<br>
              <strong>Status:</strong> Resolved ✅
            </div>
            
            <p>Thank you for helping make your city better! Your contribution is making a real difference in our community.</p>
            <p style="margin-top: 20px;">If you notice any other issues, please don't hesitate to report them.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nagar Nigam Complaint System.</p>
            <p>&copy; 2025 Smart City Initiative</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

export async function sendEmail(
  recipientEmail: string, 
  type: NotificationType,
  ticketNumber: string,
  title: string,
  userName?: string
): Promise<boolean> {
  if (!recipientEmail) {
    console.log('No email address provided, skipping email notification');
    return false;
  }

  try {
    const gmail = await getUncachableGmailClient();
    const template = emailTemplates[type](ticketNumber, title, userName);
    
    const rawMessage = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${recipientEmail}`,
      `Subject: ${template.subject}`,
      '',
      template.html
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`Email sent successfully to ${recipientEmail} for ${type}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
