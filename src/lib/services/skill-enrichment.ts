// Stub — service not yet implemented
export interface EnrichedSkillDescription {
  coreDescription: string
  aiLayerDescription: string
  aiToolTip: string
  updatedAt: Date
}

export async function enrichSkillDescription(
  _skillId: string,
  _skillTitle: string | null,
  _competenceFieldTitle?: string
): Promise<EnrichedSkillDescription> {
  throw new Error("skill-enrichment service not yet implemented")
}
