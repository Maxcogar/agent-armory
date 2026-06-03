/**
 * AJV 2020-12 validator (Spec FR12, AC10; Architecture D7).
 *
 * The Context Package JSON is the machine contract; a malformed package is
 * rejected BEFORE it can be injected into an agent (FR12 acceptance).
 */
import Ajv2020Import from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';

// ajv + ajv-formats are CJS with __esModule; under NodeNext the default import
// is the class/function at runtime, but the static types need a cast.
const Ajv2020 = (Ajv2020Import as any).default ?? Ajv2020Import as unknown as {
  new (opts: Record<string, unknown>): any;
};
const addFormats = ((addFormatsImport as any).default ?? addFormatsImport) as (ajv: any) => void;
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ContextPackage } from '../../core/domain/context-package.js';
import type { ReviewResult } from '../../core/domain/review-finding.js';
import type { ContextExpansionRequest } from '../../core/domain/context-expansion.js';
import type { HumanOverrideRequest } from '../../core/domain/human-override.js';

const here = dirname(fileURLToPath(import.meta.url));

function loadSchema(name: string): object {
  // Resolve next to the source in dev (tsx) and next to dist after build.
  return JSON.parse(readFileSync(join(here, name), 'utf8'));
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SchemaValidator {
  private ajv: any;
  private validatePackageFn;
  private validateReviewFn;
  private validateExpansionRequestFn;
  private validateHumanOverrideFn;

  constructor() {
    this.ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.validatePackageFn = this.ajv.compile(loadSchema('context-package.schema.json'));
    this.validateReviewFn = this.ajv.compile(loadSchema('review.schema.json'));
    this.validateExpansionRequestFn = this.ajv.compile(loadSchema('expansion-request.schema.json'));
    this.validateHumanOverrideFn = this.ajv.compile(loadSchema('human-override.schema.json'));
  }

  validatePackage(pkg: unknown): ValidationResult {
    const valid = this.validatePackageFn(pkg) as boolean;
    return { valid, errors: this.fmt(this.validatePackageFn.errors) };
  }

  validateReview(r: unknown): ValidationResult {
    const valid = this.validateReviewFn(r) as boolean;
    return { valid, errors: this.fmt(this.validateReviewFn.errors) };
  }

  validateExpansionRequest(r: unknown): ValidationResult {
    const valid = this.validateExpansionRequestFn(r) as boolean;
    return { valid, errors: this.fmt(this.validateExpansionRequestFn.errors) };
  }

  validateHumanOverride(r: unknown): ValidationResult {
    const valid = this.validateHumanOverrideFn(r) as boolean;
    return { valid, errors: this.fmt(this.validateHumanOverrideFn.errors) };
  }

  /** Throws if invalid — used at injection time so bad packages never reach an agent. */
  assertPackage(pkg: ContextPackage): void {
    const r = this.validatePackage(pkg);
    if (!r.valid) throw new Error(`Invalid context package:\n  ${r.errors.join('\n  ')}`);
  }

  assertReview(r: ReviewResult): void {
    const res = this.validateReview(r);
    if (!res.valid) throw new Error(`Invalid review result:\n  ${res.errors.join('\n  ')}`);
  }

  assertExpansionRequest(r: ContextExpansionRequest): void {
    const res = this.validateExpansionRequest(r);
    if (!res.valid) throw new Error(`Invalid expansion request:\n  ${res.errors.join('\n  ')}`);
  }

  assertHumanOverride(r: HumanOverrideRequest): void {
    const res = this.validateHumanOverride(r);
    if (!res.valid) throw new Error(`Invalid human override:\n  ${res.errors.join('\n  ')}`);
  }

  private fmt(errors: unknown): string[] {
    if (!Array.isArray(errors)) return [];
    return errors.map((e: any) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim());
  }
}
