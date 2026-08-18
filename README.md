# Four Failure Modes, Two Fixes, and a Loop

**Hebrew Name Matching in an Agent Authorization Gate**

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22001956.svg)](https://doi.org/10.5281/zenodo.22001956)

A production authorization gate for an AI agent system asks one question before any action that touches a person: *did the manager name this person in the instruction?* When the instruction text is Hebrew, the naive implementation — a substring check — fails open: prefix letters glue onto words, so short names are swallowed inside ordinary vocabulary, and actions execute on people the manager never mentioned. The standard fix, a regex word boundary, fails in the opposite direction: `\b` never matches Hebrew in engines where `\w` is ASCII, so every action escalates.

The article walks through four failure modes and sorts them by direction (fail-open vs. fail-closed), measures the name/noun collision on a pre-registered list of 89 Israeli given names (**44.9% are also common nouns**), shows why a spellchecker is the wrong oracle in a script without capitalization, and reports a production finding: in a gate that logs only escalations, **false positives are not merely unmeasured — they are unrecordable**. Over-escalation is not a safe default either: it supplies the precondition of approval-fatigue attacks (MITRE ATT&CK T1621) for free.

## Read it

| Version | File |
|---|---|
| English (PDF, 23 pp) | [`levy-2026-four-failure-modes-en.pdf`](levy-2026-four-failure-modes-en.pdf) |
| Hebrew (PDF, 19 pp) | [`levy-2026-four-failure-modes-he.pdf`](levy-2026-four-failure-modes-he.pdf) |
| English (HTML source) | [`article-en.html`](article-en.html) |
| Hebrew (HTML source) | [`article-he.html`](article-he.html) |

Permanent record: **[doi.org/10.5281/zenodo.22001956](https://doi.org/10.5281/zenodo.22001956)** (Zenodo, published 2026-08-18).

## Comments, corrections, refutations

The corpora and the 89-name list are published in the article **so they can be argued with**. If you found a counterexample, a failure mode I missed, a prior publication of any of the claims, or an error in a measurement — **[open an issue](../../issues)**. Refutations are welcome; that is what the artifacts are for.

## Cite

```bibtex
@misc{levy2026fourfailuremodes,
  author = {Levy, Ariel},
  title  = {Four Failure Modes, Two Fixes, and a Loop:
            Hebrew Name Matching in an Agent Authorization Gate},
  year   = {2026},
  month  = aug,
  doi    = {10.5281/zenodo.22001956},
  url    = {https://doi.org/10.5281/zenodo.22001956},
  note   = {Preprint}
}
```

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — reuse freely with attribution.
