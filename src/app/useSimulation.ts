import { useEffect, useReducer } from 'react';
import { advanceSimulation, configureSimulation, createSimulation, presets, resetSimulation } from '../engine';
import type { PresetId, SimulationConfig } from '../engine';

function initial(preset: PresetId) {
  return { preset, model: createSimulation(presets[preset]), status: 'ready' as 'ready' | 'running' | 'paused' };
}
type Action = { type: 'tick' | 'toggle' | 'reset' } | { type: 'select'; preset: PresetId } | { type: 'edit'; patch: Partial<SimulationConfig> };
function reduce(state: ReturnType<typeof initial>, action: Action): ReturnType<typeof initial> {
  switch (action.type) {
    case 'select': return initial(action.preset);
    case 'reset': return { ...state, status: 'ready', model: resetSimulation(presets[state.preset]) };
    case 'toggle': return { ...state, status: state.status === 'running' ? 'paused' : 'running' };
    case 'tick': return state.status === 'running' ? { ...state, model: advanceSimulation(state.model, 250) } : state;
    case 'edit': return { ...state, model: configureSimulation(state.model, { ...state.model.config, ...action.patch }) };
  }
}
export function useSimulation() {
  const [state, dispatch] = useReducer(reduce, 'healthy', initial);
  useEffect(() => {
    if (state.status !== 'running') return;
    const timer = window.setInterval(() => {
      if (!document.hidden) dispatch({ type: 'tick' });
    }, 250);
    return () => window.clearInterval(timer);
  }, [state.status]);
  return { ...state, dispatch };
}
