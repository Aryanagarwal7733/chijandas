const nodemailer = require('nodemailer');

/**
 * Sends a confirmation email to the customer when they place an order.
 * If SMTP credentials are not set in .env, falls back to logging the email to the console.
 */
const sendOrderConfirmation = async (userEmail, userName, orderDetails) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'aryanagarwal610@gmail.com';
  const emailUser = process.env.EMAIL_USER || adminEmail;
  const emailPass = process.env.EMAIL_PASS;

  const subject = `Chijandas Grocery - Order Confirmation (#${orderDetails.orderId.toString().slice(-6)})`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 30px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Order Confirmed!</h1>
          <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 14px;">Thank you for shopping with Chijandas Grocery</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="margin-top: 0; font-size: 16px; line-height: 1.5; color: #4b5563;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #4b5563;">We have received your order and are processing it. Below are your purchase details:</p>

          <!-- Order details box -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; color: #0f172a; font-size: 16px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Product:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111827;">${orderDetails.productName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Quantity:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111827;">${orderDetails.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Price per item:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111827;">$${orderDetails.price.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 12px 0 6px 0; color: #0f172a; font-weight: 700; font-size: 16px;">Total Price:</td>
                <td style="padding: 12px 0 6px 0; text-align: right; font-weight: 700; color: #10b981; font-size: 18px;">$${(orderDetails.quantity * orderDetails.price).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping and Payment Details -->
          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4b5563; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px dashed #d1d5db;">
              ${orderDetails.shippingAddress}
            </p>
          </div>

          <div>
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Method</h4>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 6px; display: inline-block;">
              ${orderDetails.paymentMethod}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0 0 4px 0;">This is an automated order confirmation email.</p>
          <p style="margin: 0;">&copy; 2026 Chijandas Grocery. All rights reserved.</p>
        </div>

      </div>
    </div>
  `;

  // Check if credentials are set
  if (!emailPass) {
    console.log('\n============================================================');
    console.log(`>>> MOCK EMAIL CONFIRMATION SENT TO: ${userEmail}`);
    console.log(`>>> FROM: ${adminEmail}`);
    console.log(`>>> SUBJECT: ${subject}`);
    console.log(`>>> DETAILS: ${orderDetails.quantity}x ${orderDetails.productName} for $${(orderDetails.quantity * orderDetails.price).toFixed(2)}`);
    console.log('>>> Setup EMAIL_PASS in server/.env to send real emails via SMTP!');
    console.log('============================================================\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `Chijandas Grocery Admin <${emailUser}>`,
      to: userEmail,
      cc: adminEmail, // Copy the admin on all customer orders
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`>>> Email sent successfully: ${info.messageId}`);
  } catch (err) {
    console.error('Error sending confirmation email:', err);
  }
};

module.exports = {
  sendOrderConfirmation
};
