import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAppointmentConfirmation({
  to,
  patientName,
  dentistName,
  clinicName,
  appointmentDate,
  appointmentTime,
  appointmentId,
}: {
  to: string;
  patientName: string;
  dentistName: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentId: string;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "DentCall <noreply@dentcall.io>",
    to,
    subject: `Appointment Confirmed - ${appointmentDate}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">DentCall</h1>
        <h2>Your appointment is confirmed!</h2>
        <p>Hi ${patientName},</p>
        <p>Your appointment has been confirmed. Here are the details:</p>
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Dentist:</strong> Dr. ${dentistName}</p>
          <p><strong>Clinic:</strong> ${clinicName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/appointments/${appointmentId}"
             style="background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Appointment
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Need to cancel or reschedule? Visit your <a href="${process.env.NEXTAUTH_URL}/appointments">appointments page</a>.
        </p>
      </div>
    `,
  });
}

export async function sendAppointmentReminder({
  to,
  patientName,
  dentistName,
  appointmentDate,
  appointmentTime,
  appointmentId,
}: {
  to: string;
  patientName: string;
  dentistName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentId: string;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "DentCall <noreply@dentcall.io>",
    to,
    subject: `Reminder: Appointment tomorrow with Dr. ${dentistName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">DentCall</h1>
        <h2>Appointment Reminder</h2>
        <p>Hi ${patientName},</p>
        <p>This is a reminder that you have an appointment tomorrow:</p>
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Dentist:</strong> Dr. ${dentistName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/appointments/${appointmentId}"
             style="background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Details
          </a>
        </p>
      </div>
    `,
  });
}
