
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { MailCheck } from 'lucide-react';

interface TwoFactorVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({ 
  email, 
  onVerificationComplete,
  onCancel
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();

  const handleSendCode = async () => {
    setIsSending(true);
    const { success } = await sendOtp(email);
    setIsSending(false);
    if (success) {
      setCodeSent(true);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length < 6) return;
    
    setIsVerifying(true);
    const { success } = await verifyOtp(email, otpCode);
    setIsVerifying(false);
    
    if (success) {
      onVerificationComplete();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-center">
          Verify your identity before changing your password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!codeSent ? (
          <div className="text-center">
            <p className="mb-4">We'll send a verification code to your email:</p>
            <p className="font-medium mb-6">{email}</p>
            <Button 
              className="w-full" 
              onClick={handleSendCode}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto text-center mb-4 text-green-600">
              <MailCheck className="h-12 w-12 mx-auto mb-2" />
              <p>A verification code has been sent to your email.</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-center mb-4">Enter the 6-digit code from your email</p>
              <InputOTP 
                maxLength={6}
                value={otpCode} 
                onChange={setOtpCode}
                className="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center text-sm">
              <p>Didn't receive the code? <Button variant="link" onClick={handleSendCode} disabled={isSending} className="p-0 h-auto">Resend</Button></p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {codeSent && (
          <Button 
            onClick={handleVerifyCode} 
            disabled={otpCode.length < 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TwoFactorVerification;
