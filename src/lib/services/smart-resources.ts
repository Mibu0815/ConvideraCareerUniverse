// Stub — service not yet implemented
export interface ResourceSearchResult {
  title: string
  url: string
  type: string
  description: string
}

export async function searchSmartResources(
  _skillTitle: string,
  _level: number
): Promise<ResourceSearchResult[]> {
  throw new Error("smart-resources service not yet implemented")
}
