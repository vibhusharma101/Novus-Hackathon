import type { Metadata } from 'next'
import { CalculatorWizard } from '@/components/calculator/wizard'

export const metadata: Metadata = {
  title: 'Liability Calculator | EPRx Exchange',
  description: 'Calculate your EPR plastic packaging liability in 3 steps.',
}

export default function CalculatorPage() {
  return <CalculatorWizard />
}
