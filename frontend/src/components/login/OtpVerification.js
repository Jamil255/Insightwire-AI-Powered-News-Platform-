import React, { useState } from "react";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import axios from "axios";

const OtpVerification = ({ sessionInfo }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();
  auth.languageCode = "en";

  const setUpRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" },
      auth
    );
  };

  const sendOtp = async () => {
    try {
      setUpRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      alert("OTP sent successfully!");
    } catch (error) {
      setErrorMessage("Failed to send OTP. Please try again.");
      console.error(error);
    }
  };

  const verifyOtp = async () => {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();
      
      const response = await axios.post("http://localhost:5000/api/auth/verifyOtp", {
        otp,
        sessionInfo, // Include session info in the request
      });
      alert("Login successful!");
      console.log(response.data);
    } catch (error) {
      setErrorMessage("Invalid OTP. Please try again.");
      console.error(error);
    }
  };

  return (
    <div>
      <h2>OTP Login</h2>
      <div id="recaptcha-container"></div>
      {!confirmationResult ? (
        <div>
          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <button onClick={sendOtp}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </div>
      )}
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default OtpVerification;
