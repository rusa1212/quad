import { createContext, useContext } from 'react'

export const ProgramsContext = createContext(null)

// { programs: Program[], loading: boolean, error: Error | null, getProgramById(id), reload() }
export function usePrograms() {
  const context = useContext(ProgramsContext)
  if (!context) throw new Error('usePrograms는 ProgramsProvider 안에서만 사용할 수 있어요.')
  return context
}
