# Fixture toy task

**Task given to `/expert`:** "Add a `farewell(name)` function to `greeter.js`
that mirrors `greet` — same input validation, returning `Goodbye, <name>!` —
and a unit test for it."

This task is intentionally small but reaches every phase: it needs a spec
(what `farewell` must do, including the validation contract), an architecture
decision (mirror `greet`'s validation rather than duplicate it — a real
choice), a plan (edit `greeter.js`, add a test), an implementation, a review,
and a ground-truth check (call `farewell` and observe the output and the
thrown error on bad input). It forces at least one real review round because
the validation-sharing decision is a genuine design point a reviewer will
scrutinize.
