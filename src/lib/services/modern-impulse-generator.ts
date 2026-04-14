// Stub — service not yet implemented
export interface ModernImpulse {
  title: string
  description: string
  steps: string[]
}

export async function generateModernImpulse(
  _skillTitle: string,
  _level: number
): Promise<ModernImpulse> {
  throw new Error("modern-impulse-generator service not yet implemented")
}
