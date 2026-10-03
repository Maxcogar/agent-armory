// The structured headline (Step 6 build delta, G24). Runtime, dependency-free.
// A headline is template words written in the genre module (`lit`) and typed
// slots; the composer (Step 19) renders only `Lit` text and slot values, so
// repo-derived prose is unrepresentable. The `human` slot carries only
// human-provenance text (`note`, Step 35).
//
// `lit`'s parameter type admits only a string literal: `lit(s)` with `s: string`
// fails TS2345 (executed under TypeScript 5.9.3, T-6-3). An interpolated template
// literal still type-checks, which is why Step 19's T-19-3 scans the genre
// sources for it.

/** A template word written in the genre module. */
export type Lit = { readonly kind: 'lit'; readonly text: string };

export type Slot =
  | { readonly kind: 'path'; readonly fileId: number; readonly path: string; readonly ownTarget: boolean }
  | { readonly kind: 'commit'; readonly hash: string }
  | { readonly kind: 'symbol'; readonly name: string }
  | { readonly kind: 'count'; readonly value: number }
  | { readonly kind: 'ratio'; readonly num: number; readonly den: number }
  | { readonly kind: 'days'; readonly value: number }
  | { readonly kind: 'human'; readonly text: string };

export type Headline = { readonly parts: ReadonlyArray<Lit | Slot> };

/** Literal-only: `lit(s)` with `s: string` fails to compile (TS2345). */
export function lit<const T extends string>(text: string extends T ? never : T): Lit {
  return { kind: 'lit', text };
}

type SlotOf<K extends Slot['kind']> = Omit<Extract<Slot, { kind: K }>, 'kind'>;

/** Slot builders: each returns the slot of its kind carrying exactly the given values. */
export const slot = {
  path(v: SlotOf<'path'>): Slot {
    return { kind: 'path', fileId: v.fileId, path: v.path, ownTarget: v.ownTarget };
  },
  commit(v: SlotOf<'commit'>): Slot {
    return { kind: 'commit', hash: v.hash };
  },
  symbol(v: SlotOf<'symbol'>): Slot {
    return { kind: 'symbol', name: v.name };
  },
  count(v: SlotOf<'count'>): Slot {
    return { kind: 'count', value: v.value };
  },
  ratio(v: SlotOf<'ratio'>): Slot {
    return { kind: 'ratio', num: v.num, den: v.den };
  },
  days(v: SlotOf<'days'>): Slot {
    return { kind: 'days', value: v.value };
  },
  human(v: SlotOf<'human'>): Slot {
    return { kind: 'human', text: v.text };
  },
};
