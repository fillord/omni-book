import { redirect } from 'next/navigation'

// Legacy route /clinic → redirect to the actual tenant slug
export default function ClinicPage() {
  redirect('/city-polyclinic')
}
