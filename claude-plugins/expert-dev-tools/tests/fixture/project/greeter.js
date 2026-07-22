// Toy fixture codebase for the expert-dev-tools lifecycle acceptance run.
// Deliberately small: the toy task ("add a farewell function that mirrors
// greet") must reach every lifecycle phase and force at least one real review
// round, without being large enough to make an acceptance run expensive.

export function greet(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('name must be a non-empty string');
  }
  return `Hello, ${name}!`;
}
