import React, { createContext, useContext, useRef } from 'react';
import { ParticleExplosion, type ExplosionHandle } from '../components/ParticleExplosion';

const ExplosionCtx = createContext<{ explode: (x: number, y: number, color?: string) => void }>({
  explode: () => {},
});

export function ExplosionProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ExplosionHandle>(null);

  const explode = (x: number, y: number, color?: string) => {
    ref.current?.explode(x, y, color);
  };

  return (
    <ExplosionCtx.Provider value={{ explode }}>
      {children}
      <ParticleExplosion ref={ref} />
    </ExplosionCtx.Provider>
  );
}

export const useExplosion = () => useContext(ExplosionCtx);
