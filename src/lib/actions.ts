'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createUserClient } from '@/lib/supabase'

// Pattern for every Server Action in this project:
//   1. Verify auth
//   2. Parse / validate input with zod
//   3. Call createUserClient() — never supabaseAdmin for user data
//   4. revalidatePath or redirect

export async function exampleAction(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const supabase = await createUserClient()

  const { error } = await supabase
    .from('example_table')
    .insert({ name, user_id: userId })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
