import { redirect } from 'next/navigation'

export default function SellerLoginRedirect() {
  redirect('/seller/sign-in')
}
