import { createContext, useContext } from 'react';

type ScrollContextType = {
  handleScroll: (y: number) => void;
};

export const ScrollContext = createContext<ScrollContextType>({
  handleScroll: () => {},
});

export function useScroll() {
  return useContext(ScrollContext);
}