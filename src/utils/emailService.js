const nodemailer = require('nodemailer');
const axios = require('axios');

const sendSubmissionEmail = async (application) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const applicantName = `${application.applicantInfo?.firstName || ''} ${application.applicantInfo?.lastName || ''}`.trim() || 'Applicant';
    const applicantEmail = application.contactDetails?.email || 'N/A';
    const programType = application.programInfo?.programType || 'PhD/Postdoctoral';

    // 1. Prepare Attachments
    const attachments = [];
    if (application.documents) {
      for (const [key, url] of Object.entries(application.documents)) {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const extension = url.split('.').pop().split('?')[0] || 'pdf';
            attachments.push({
              filename: `${key.toUpperCase()}.${extension}`,
              content: Buffer.from(response.data),
            });
          } catch (err) {
            console.error(`Failed to attach document ${key}:`, err.message);
          }
        }
      }
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    // 2. Format HTML Data Table
    const formatSection = (title, data) => {
      if (!data) return '';
      let rows = '';
      for (const [key, value] of Object.entries(data)) {
        if (key === '_id' || key === 'id' || key === 'photo') continue; // Remove photo row
        
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        let displayValue = value;

        // Custom formatting for dates
        if (key === 'dob' || key === 'dateOfTest' || key === 'expiryDate' || key === 'date') {
          displayValue = formatDate(value);
        } else if (key === 'publications' && Array.isArray(value)) {
          // Custom formatting for publications array of objects
          displayValue = value.map(p => `${p.title} (${p.journalType})`).join(', ');
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        }

        rows += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">${label}</td><td style="padding: 8px; border: 1px solid #ddd;">${displayValue || 'N/A'}</td></tr>`;
      }
      return `
        <h3 style="color: #ED1C24; margin-top: 25px; border-bottom: 2px solid #eee; padding-bottom: 5px;">${title}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">${rows}</table>
      `;
    };

    // Prepare Declaration Data with Submission Date
    const declarationData = {
      ...application.declaration,
      submissionDate: application.submittedAt
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-bottom: 4px solid #ED1C24;">
          <h1 style="color: #ED1C24; margin: 0;">Spectrum Consultants</h1>
          <p style="margin: 5px 0; color: #666;">PhD Application Tracking System</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Full Application Details: ${applicantName}</h2>
          <p>A new application was submitted on <strong>${formatDate(application.submittedAt)}</strong> at ${new Date(application.submittedAt).toLocaleTimeString()}.</p>
          
          ${formatSection('Applicant Info', application.applicantInfo)}
          ${formatSection('Contact Details', application.contactDetails)}
          ${formatSection('Guardian Information', application.guardianInfo)}
          ${formatSection('Program & Research', application.programInfo)}
          
          <h3 style="color: #ED1C24; margin-top: 25px; border-bottom: 2px solid #eee; padding-bottom: 5px;">Academic Background</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd;">Degree</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Institution</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Year</th>
                <th style="padding: 8px; border: 1px solid #ddd;">GPA</th>
              </tr>
            </thead>
            <tbody>
              ${application.academicBackground?.map(edu => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${edu.degree}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${edu.institution}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${edu.year}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${edu.cgpa}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No data</td></tr>'}
            </tbody>
          </table>

          ${formatSection('Research Experience', application.researchExperience)}
          ${formatSection('English Proficiency', application.englishProficiency)}
          ${formatSection('Funding Info', application.fundingInfo)}

          <h3 style="color: #ED1C24; margin-top: 25px; border-bottom: 2px solid #eee; padding-bottom: 5px;">Referees</h3>
          ${application.referees?.map((ref, idx) => `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; background-color: #fafafa;">
              <strong>Referee #${idx + 1}:</strong> ${ref.name} (${ref.designation})<br/>
              Email: ${ref.email} | Phone: ${ref.phone}<br/>
              Institution: ${ref.institution} | Relation: ${ref.relation}
            </div>
          `).join('') || 'No referees'}

          ${formatSection('Declaration', declarationData)}
        </div>
        
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 14px;">This is an automated application report.</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #bbb;">&copy; 2026 Spectrum Consultants. All rights reserved.</p>
        </div>
      </div>
    `;

    // 3. Admin Notification
    const adminMailOptions = {
      from: `"Spectrum PhD Admissions" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `COMPLETE Application Received: ${applicantName} [${programType}]`,
      html: htmlContent,
      attachments: attachments
    };

    // 4. Compact Student Confirmation
    const applicantMailOptions = {
      from: `"Spectrum PhD Admissions" <${process.env.GMAIL_USER}>`,
      to: applicantEmail,
      subject: 'Application Successfully Received - Spectrum Consultants',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #28a745;">Submission Successful!</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for choosing Spectrum Consultants. Your application for <strong>${programType}</strong> has been received in full.</p>
          <p>All your submitted details and documents are now being reviewed by our team. We will notify you of any status updates via email and your dashboard.</p>
          <br/>
          <p>Best Regards,<br/>PhD Admissions Team</p>
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(applicantMailOptions);
    
    console.log('Detailed submission emails sent successfully');
  } catch (error) {
    console.error('Error sending detailed submission emails:', error);
  }
};

const sendRemarkNotification = async (studentEmail, content, applicationId) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Spectrum PhD Admissions" <${process.env.GMAIL_USER}>`,
      to: studentEmail,
      subject: 'New Remark on Your PhD Application - Spectrum Consultants',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #ED1C24;">New Remark Received</h2>
          <p>Dear Applicant,</p>
          <p>A new comment or update has been posted on your PhD application. Please log in to your dashboard to view the full details and respond if necessary.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ED1C24; margin: 20px 0;">
            <strong>Comment:</strong><br/>
            <p style="white-space: pre-wrap;">${content}</p>
          </div>
          
          <p>Click the link below to go to your dashboard:</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #ED1C24; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">View Dashboard</a>
          
          <br/><br/>
          <p>Best Regards,<br/>PhD Admissions Team<br/>Spectrum Consultants</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Remark notification email sent to:', studentEmail);
  } catch (error) {
    console.error('Error sending remark notification email:', error);
  }
};

module.exports = { sendSubmissionEmail, sendRemarkNotification };

