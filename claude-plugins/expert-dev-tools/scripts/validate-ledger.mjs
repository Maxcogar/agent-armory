#!/usr/bin/env node
// Dependency-free validator for the expert-dev-tools ledger (architecture C7, plan D-P2).
// Validates a ledger file against scripts/ledger.schema.json. Supports exactly the
// JSON Schema draft-2020-12 keywords the ledger schema uses: type (incl. union arrays),
// required, properties, additionalProperties (false | subschema), enum, minimum,
// minLength, minItems, pattern, items, $ref (#/$defs/*), $defs. No external dependencies.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, 'ledger.schema.json');

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  if (typeof v === 'number') return 'number';
  return typeof v; // 'string' | 'boolean' | 'object'
}

function matchesType(v, t) {
  const actual = typeOf(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t; // 'integer' matches only integers, so 1.5 fails an integer schema
}

function resolveRef(ref, root) {
  const m = /^#\/\$defs\/(.+)$/.exec(ref);
  if (!m) throw new Error(`unsupported $ref (only #/$defs/* is supported): ${ref}`);
  const def = root.$defs && root.$defs[m[1]];
  if (!def) throw new Error(`missing $def for ref: ${ref}`);
  return def;
}

// Validate `data` against `schema`; push human-readable errors into `errors`.
export function validate(data, schema, root, path, errors) {
  if (schema.$ref) {
    return validate(data, resolveRef(schema.$ref, root), root, path, errors);
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(data, t))) {
      errors.push(`${path}: expected type ${types.join('|')}, got ${typeOf(data)}`);
      return errors; // downstream checks are meaningless once the type is wrong
    }
  }

  if (schema.enum !== undefined && !schema.enum.some((e) => e === data)) {
    errors.push(`${path}: ${JSON.stringify(data)} is not one of [${schema.enum.join(', ')}]`);
  }

  if (schema.minimum !== undefined && typeof data === 'number' && data < schema.minimum) {
    errors.push(`${path}: ${data} is below minimum ${schema.minimum}`);
  }

  if (schema.minLength !== undefined && typeof data === 'string' && data.length < schema.minLength) {
    errors.push(`${path}: string length ${data.length} is below minLength ${schema.minLength}`);
  }

  if (schema.pattern !== undefined && typeof data === 'string' && !new RegExp(schema.pattern).test(data)) {
    errors.push(`${path}: "${data}" does not match pattern ${schema.pattern}`);
  }

  if (typeOf(data) === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${path}: array has ${data.length} item(s), minItems is ${schema.minItems}`);
    }
    if (schema.items !== undefined) {
      data.forEach((el, i) => validate(el, schema.items, root, `${path}[${i}]`, errors));
    }
  }

  if (typeOf(data) === 'object') {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in data)) errors.push(`${path}: missing required property '${key}'`);
      }
    }
    const props = schema.properties || {};
    for (const [key, val] of Object.entries(data)) {
      if (key in props) {
        validate(val, props[key], root, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: additional property '${key}' is not allowed`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validate(val, schema.additionalProperties, root, `${path}.${key}`, errors);
      }
    }
  }

  return errors;
}

export function validateLedgerFile(ledgerPath, schemaPath = SCHEMA_PATH) {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const data = JSON.parse(readFileSync(ledgerPath, 'utf8'));
  return validate(data, schema, schema, '$', []);
}

function main() {
  const ledgerPath = process.argv[2];
  if (!ledgerPath) {
    console.error('usage: node validate-ledger.mjs <ledger.json>');
    process.exit(2);
  }
  let errors;
  try {
    errors = validateLedgerFile(ledgerPath);
  } catch (e) {
    console.error(`cannot validate ${ledgerPath}: ${e.message}`);
    process.exit(1);
  }
  if (errors.length) {
    console.error(`INVALID ledger (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('VALID ledger');
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
