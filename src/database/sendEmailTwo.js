import axios from "axios";

const sendEmailTwo = async (recipientEmail, subject, content) => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY_ADMIN;

  const data = {
    sender: { email: "no-reply@playmakershub.org", name: "Playmakershub" },
    to: [{ email: recipientEmail }],
    subject: subject,
    htmlContent: `<p>${content}</p>`,
  };

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );

    console.log("Email sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    return error;
  }
};

export default sendEmailTwo;
