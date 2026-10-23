import type { Proc } from './triggers';
import type { EffectKind, EffectSpec } from './types';

/**
 * One handler per effect kind. Whatever system applies effects (combat,
 * overworld) supplies these; `C` is that system's context object.
 */
export type EffectHandlers<C> = {
  [K in EffectKind]: (spec: Extract<EffectSpec, { kind: K }>, ctx: C, proc: Proc | undefined) => void;
};

export function applyEffect<C>(spec: EffectSpec, handlers: EffectHandlers<C>, ctx: C, proc?: Proc): void {
  // The mapped type guarantees the handler matches spec.kind; TypeScript
  // cannot narrow the lookup on its own.
  const handler = handlers[spec.kind] as (s: EffectSpec, c: C, p: Proc | undefined) => void;
  handler(spec, ctx, proc);
}

export function dispatchProcs<C>(procs: readonly Proc[], handlers: EffectHandlers<C>, ctx: C): void {
  for (const proc of procs) {
    for (const spec of proc.effects) applyEffect(spec, handlers, ctx, proc);
  }
}
