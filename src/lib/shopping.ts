import type { ShoppingItem } from '../types'

const NONE: ShoppingItem[] = []

// taskId → that task's shopping items
export function groupShoppingByTask(items: ShoppingItem[]) {
  const byTask = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    if (!item.taskId) continue
    byTask.set(item.taskId, [...(byTask.get(item.taskId) ?? []), item])
  }
  return (taskId: string) => byTask.get(taskId) ?? NONE
}
