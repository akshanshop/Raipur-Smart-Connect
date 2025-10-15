import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export type NotificationType = 
  | 'complaint_submitted' 
  | 'complaint_acknowledged' 
  | 'complaint_in_progress' 
  | 'complaint_resolved';

const messageTemplates: Record<NotificationType, (ticketNumber: string, title: string) => string> = {
  complaint_submitted: (ticketNumber, title) => 
    `Your complaint has been submitted successfully! Ticket #${ticketNumber}: ${title}. We will update you on the progress.`,
  
  complaint_acknowledged: (ticketNumber, title) => 
    `Good news! Nagar Nigam officials have acknowledged your complaint. Ticket #${ticketNumber}: ${title}. They are reviewing the issue.`,
  
  complaint_in_progress: (ticketNumber, title) => 
    `Your issue is now being resolved! Ticket #${ticketNumber}: ${title}. Officials are actively working on this complaint.`,
  
  complaint_resolved: (ticketNumber, title) => 
    `Great news! Your complaint has been resolved. Ticket #${ticketNumber}: ${title}. Thank you for making your city better!`
};

export async function sendSMS(
  phoneNumber: string, 
  type: NotificationType,
  ticketNumber: string,
  title: string
): Promise<boolean> {
  if (!phoneNumber) {
    console.log('No phone number provided, skipping SMS notification');
    return false;
  }

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const message = messageTemplates[type](ticketNumber, title);
    
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`SMS sent successfully to ${phoneNumber} for ${type}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function sendWhatsApp(
  phoneNumber: string,
  type: NotificationType,
  ticketNumber: string,
  title: string
): Promise<boolean> {
  if (!phoneNumber) {
    console.log('No phone number provided, skipping WhatsApp notification');
    return false;
  }

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const message = messageTemplates[type](ticketNumber, title);
    
    await client.messages.create({
      body: message,
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:${phoneNumber}`
    });

    console.log(`WhatsApp message sent successfully to ${phoneNumber} for ${type}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}
