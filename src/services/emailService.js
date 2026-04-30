import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();


export const sendEmailOTP = async (email, otp) => {
  console.log("EMAIL:", process.env.EMAIL);
  console.log("PASS length:", process.env.PASSWORD?.length);
  console.log("Sending to:", email);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { 
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL, 
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`
    });
    console.log("Mail sent:", info.response);
  } catch (err) {
    console.error("Mail error:", err.message); 
    throw err;
  }
};