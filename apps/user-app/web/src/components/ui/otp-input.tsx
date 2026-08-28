import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const [otpArray, setOtpArray] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const newOtpArray = value.split('').slice(0, length);
    while (newOtpArray.length < length) {
      newOtpArray.push('');
    }
    setOtpArray(newOtpArray);
  }, [value, length]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) return; // Prevent pasting multiple chars (handled by onPaste)
    
    const newOtpArray = [...otpArray];
    newOtpArray[index] = val;
    
    const newOtpString = newOtpArray.join('');
    onChange(newOtpString);

    // Auto focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).split('');
    const newOtpArray = [...otpArray];
    
    pastedData.forEach((char, index) => {
      if (index < length && /^[0-9]$/.test(char)) {
        newOtpArray[index] = char;
      }
    });
    
    const newOtpString = newOtpArray.join('');
    onChange(newOtpString);
    
    const nextEmptyIndex = newOtpArray.findIndex(val => val === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all outline-none disabled:opacity-50 text-[#171717]"
        />
      ))}
    </div>
  );
}
