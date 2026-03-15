'use server'

import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { generateOtp, getIpAddress } from '@/lib/auth/otp'
import { sendOtpEmail } from '@/lib/email/resend'

// ----------------------------------------------------------------------------
// Registration verification
// ----------------------------------------------------------------------------

export async function verifyRegistrationOtp(email: string, code: string) {
  const cleanEmail = email.toLowerCase().trim()
  const cleanCode = code.trim()

  const record = await basePrisma.otpCode.findUnique({
    where: { email_code: { email: cleanEmail, code: cleanCode } },
  })

  if (!record) {
    return { error: 'Неверный код' }
  }

  if (record.expiresAt < new Date()) {
    return { error: 'Код истёк. Пожалуйста, запросите новый.' }
  }

  const reqHeaders = await headers()
  const ip = getIpAddress(reqHeaders)

  // Mark user verified and save IP
  await basePrisma.user.update({
    where: { email: cleanEmail },
    data: {
      emailVerified: new Date(),
      lastIpAddress: ip,
    },
  })

  // Delete the used code
  await basePrisma.otpCode.delete({ where: { id: record.id } })

  return { success: true }
}

export async function resendRegistrationOtp(email: string) {
  const cleanEmail = email.toLowerCase().trim()

  const user = await basePrisma.user.findUnique({ where: { email: cleanEmail } })
  if (!user) return { error: 'Пользователь не найден' }

  // Generate new code
  const code = generateOtp()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Upsert to replace any old unverified code for this email
  await basePrisma.otpCode.upsert({
    where: { email_code: { email: cleanEmail, code } },
    update: { expiresAt },
    create: { email: cleanEmail, code, expiresAt },
  })

  await sendOtpEmail(cleanEmail, code)
  return { success: true }
}

// ----------------------------------------------------------------------------
// Login IP verification (2FA)
// ----------------------------------------------------------------------------

export async function checkLoginIp(email: string, password: string) {
  const cleanEmail = email.toLowerCase().trim()

  const user = await basePrisma.user.findUnique({ where: { email: cleanEmail } })
  if (!user || !user.passwordHash) return { error: 'Неверный email или пароль' }

  const passwordOk = await bcrypt.compare(password, user.passwordHash)
  if (!passwordOk) return { error: 'Неверный email или пароль' }

  const reqHeaders = await headers()
  const currentIp = getIpAddress(reqHeaders)

  // Check concurrent sessions (activeSessionId)
  if (user.activeSessionId) {
    return {
      requiresForceLogin: true,
      message: 'В этот аккаунт уже выполнен вход с другого устройства.'
    }
  }

  // If IP matches, or user has no last IP (legacy user), allow login
  if (!user.lastIpAddress || user.lastIpAddress === currentIp) {
    if (!user.lastIpAddress) {
      // Opportunistically save IP for legacy users
      await basePrisma.user.update({
        where: { id: user.id },
        data: { lastIpAddress: currentIp },
      })
    }
    return { requiresOtp: false, requiresForceLogin: false }
  }

  // IP mismatch -> Generate OTP
  const code = generateOtp()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Clear previous codes for this email and create new
  await basePrisma.otpCode.deleteMany({ where: { email: cleanEmail } })
  await basePrisma.otpCode.create({
    data: { email: cleanEmail, code, expiresAt },
  })

  await sendOtpEmail(cleanEmail, code)
  return { requiresOtp: true, requiresForceLogin: false }
}

export async function verifyLoginOtp(email: string, code: string) {
  const cleanEmail = email.toLowerCase().trim()
  const cleanCode = code.trim()

  const record = await basePrisma.otpCode.findUnique({
    where: { email_code: { email: cleanEmail, code: cleanCode } },
  })

  if (!record) {
    return { error: 'Неверный код' }
  }

  if (record.expiresAt < new Date()) {
    return { error: 'Код истёк. Авторизуйтесь заново.' }
  }

  const reqHeaders = await headers()
  const currentIp = getIpAddress(reqHeaders)

  // Update IP and delete code
  await basePrisma.$transaction([
    basePrisma.user.update({
      where: { email: cleanEmail },
      data: { lastIpAddress: currentIp },
    }),
    basePrisma.otpCode.delete({ where: { id: record.id } })
  ])

  return { success: true }
}
