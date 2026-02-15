import { Suspense } from 'react'
import SignupClient from './SignupClient'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupClient />
    </Suspense>
  )
}
