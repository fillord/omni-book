"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatPhone } from "@/lib/utils/phone"

interface PhoneInputProps {
  value?: string
  onChange?: (formatted: string) => void
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function PhoneInput({
  value = "",
  onChange,
  name,
  placeholder = "+7 (___) ___ __ __",
  required,
  disabled,
  className,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value ? formatPhone(value) : "")

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(value ? formatPhone(value) : "")
    }
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayValue(e.target.value)
  }

  function handleBlur() {
    const formatted = formatPhone(displayValue)
    setDisplayValue(formatted)
    onChange?.(formatted)
  }

  return (
    <Input
      type="tel"
      name={name}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
    />
  )
}
