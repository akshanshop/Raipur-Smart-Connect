import sgMail from '@sendgrid/mail';

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

// Initialize SendGrid if API key is available
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
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

  if (!sendgridApiKey) {
    console.log('SendGrid API key not configured, skipping email notification');
    return false;
  }

  if (!fromEmail) {
    console.error('SENDGRID_FROM_EMAIL environment variable is required. Please set it to a verified sender email address from your SendGrid account.');
    return false;
  }

  try {
    const template = emailTemplates[type](ticketNumber, title, userName);
    
    const msg = {
      to: recipientEmail,
      from: fromEmail,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);

    console.log(`Email sent successfully to ${recipientEmail} for ${type}`);
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return false;
  }
}
