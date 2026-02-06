import { createContext, useContext } from 'react'

interface FiltersContextValue {
  filters: Record<string, unknown>
  setFilters: (
    data:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => void
}

export const FiltersContext = createContext<FiltersContextValue>({
  filters: {},
  setFilters: () => {},
})

export const useFiltersContext = () => useContext(FiltersContext)
