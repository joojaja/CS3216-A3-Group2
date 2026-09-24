# Clothing evaluation cases

Run the manual evaluation from `app/`:

```powershell
npm run eval:clothes -- --confirm-paid
```

This command makes two paid Gemini calls for each case, one clothing analysis and one Beautify edit. It refuses to run without `--confirm-paid`.

The evaluator reads only image files directly inside this directory. It does not send anything inside `intended/` to Gemini. If `intendedBeautified` is set for a case, the evaluator copies that reference image beside the generated image for manual comparison.

To add a case:

1. Put a JPEG, PNG or WebP source image in this directory.
2. Add one entry to `expected.json` with a unique `id`, the source `file`, and all expected analysis fields.
3. Optionally put a reference image in `intended/` and set `intendedBeautified`.
4. Run the command above. Open the newest directory under the repository's `test-results/` directory.

The evaluator compares text without case differences, treats underscores and spaces as equivalent, and compares lists without considering order. A dash in `material_cues` means that no material cue is expected. It derives `name` as `<primary colour> <subcategory>` because the application does not store a separate generated name.
