/**
 * Reproduction artifact for "Four Failure Modes, Two Fixes, and a Loop"
 * DOI: 10.5281/zenodo.22001956
 *
 * Part 1 reproduces the published measurement tables (Corpus A and Corpus B).
 * Part 2 is an end-to-end demonstration of failure mode 4: a single invisible
 *        character forges a perfect name match and lets a write execute without
 *        the approval card the manager was supposed to see.
 * Part 3 applies the mitigation and re-runs the same attack.
 *
 * Run:  node gate-demo.mjs
 * No dependencies. Node 18+.
 */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ---------------------------------------------------------------- matchers
const PREFIX_LETTERS = 'ושכבלמ'
const MAX_PREFIXES = 3

const tokenize = text => text.split(/[^\p{L}]+/u).filter(Boolean)

/** Prefix stripping: allow up to three prefix letters before the name. */
function prefixStripped(token, name) {
  for (let k = 0; k <= MAX_PREFIXES && k < token.length; k++) {
    if (token.slice(k) !== name) continue
    if ([...token.slice(0, k)].every(c => PREFIX_LETTERS.includes(c))) return true
  }
  return false
}

const METHODS = {
  'includes()':      (text, name) => text.includes(name),
  '\\b':             (text, name) => new RegExp(`\\b${esc(name)}\\b`).test(text),
  '\\b with u':      (text, name) => new RegExp(`\\b${esc(name)}\\b`, 'u').test(text),
  '\\p{L} boundary': (text, name) => new RegExp(`(?<!\\p{L})${esc(name)}(?!\\p{L})`, 'u').test(text),
  'prefix stripping':(text, name) => tokenize(text).some(t => prefixStripped(t, name)),
  'hybrid':          (text, name) =>
    new RegExp(`(?<!\\p{L})[${PREFIX_LETTERS}]{0,${MAX_PREFIXES}}${esc(name)}(?!\\p{L})`, 'u').test(text),
}

// ---------------------------------------------------------------- corpora
// Corpus A: the name is swallowed inside another word and is NOT a person.
const CORPUS_A_FALSE = [
  ['שי',  'העברתי את המשימה בגלל השייכות לפרויקט'],
  ['אור', 'צריך לבדוק את האור במשרד'],
  ['שני', 'הלקוח השני בתור מחכה'],
  ['קרן', 'הקרן החדשה אושרה אתמול'],
  ['גל',  'בגלל העיכוב לא הספקנו'],
  ['רון', 'יש בעיה בשרון הצפוני היום'],
  ['תום', 'בתום היום נסגור את הדוח'],
  ['אור', 'לאור הדברים נמשיך כרגיל'],
]

// Corpus A: real mentions of a person. Three carry a prefix, five are bare.
const CORPUS_A_TRUE = [
  ['שי',  'תעביר לשי את הקובץ'],
  ['דנה', 'ולדנה תשלח תזכורת'],
  ['גל',  'תן לגל את המשימה הזו'],
  ['אור', 'תשאל את אור מה קרה'],
  ['שי',  'שי סיים את הבדיקה'],
  ['אור', 'אור צריכה לסיים את המשימה'],
  ['דנה', 'דנה מטפלת בזה'],
  ['גל',  'גל ואני נסגור את זה'],
]

// Corpus B: the name appears as a bare token and is NOT a person.
const CORPUS_B_FALSE = [
  ['אור', 'קיבלנו אור ירוק מהלקוח'],
  ['שי',  'הוא הביא שי לכבוד החג'],
  ['גל',  'גל של תלונות הגיע היום'],
  ['שחר', 'עם שחר נצא לדרך'],
  ['יעל', 'יעל טיפסה על הסלע'],
  ['קרן', 'קרן השמש חדרה פנימה'],
  ['טל',  'טל של בוקר על העשב'],
  ['ברק', 'ברק האיר את השמיים'],
  ['ים',  'ים של עבודה מחכה לנו'],
]

function reproduceTables() {
  console.log('=== Part 1: reproducing the published tables ===\n')
  const pad = (s, n) => String(s).padEnd(n)
  console.log(pad('method', 20) + pad('A false pos', 14) + pad('A true det', 14) + 'B false pos')
  console.log('-'.repeat(62))
  for (const [label, fn] of Object.entries(METHODS)) {
    const aFalse = CORPUS_A_FALSE.filter(([n, t]) => fn(t, n)).length
    const aTrue  = CORPUS_A_TRUE.filter(([n, t]) => fn(t, n)).length
    const bFalse = CORPUS_B_FALSE.filter(([n, t]) => fn(t, n)).length
    console.log(pad(label, 20) + pad(`${aFalse} of 8`, 14) + pad(`${aTrue} of 8`, 14) + `${bFalse} of 9`)
  }
  const fps = CORPUS_A_FALSE.filter(([n, t]) => METHODS['prefix stripping'](t, n))
  console.log('\nthe surviving false positives under prefix stripping:')
  for (const [name, text] of fps) {
    const hit = tokenize(text).find(t => prefixStripped(t, name))
    console.log(`  ${hit}  <-  ${name}`)
  }
}

// ------------------------------------------------- the gate, as deployed
const ROSTER = ['אור', 'שי', 'דנה', 'גפן']

/** Audit store. Note what it keeps: a card is written ONLY on escalation. */
const approvalCards = []
const writes = []

function gate(instruction, target) {
  const named = tokenize(instruction).some(t => prefixStripped(t, target))
  if (named) {
    // The manager named this person: execute, no card, instruction text not stored.
    writes.push({ target, approved: false })
    return 'EXECUTED without approval'
  }
  // Not named: escalate. This is the only path that persists the instruction text.
  approvalCards.push({ target, rationale: instruction })
  writes.push({ target, approved: true })
  return 'ESCALATED to approval'
}

const ZWSP = '​'

function demoMode4() {
  console.log('\n\n=== Part 2: failure mode 4, end to end ===\n')
  const scenarios = [
    ['manager names Or on purpose',  'תשאל את אור מה קרה עם הדוח', 'אור'],
    ['nobody is named',              'צריך לסגור את המשימה הזאת היום', 'אור'],
    ['pasted text, one ZWSP inside', `כיביתי אור${ZWSP}ות ומזגן לפני שיצאתי`, 'אור'],
  ]
  for (const [label, instruction, target] of scenarios) {
    const visible = instruction.replace(/​/g, '')   // what a human sees
    console.log(`${label}`)
    console.log(`  text on screen : ${visible}`)
    console.log(`  bytes actually : ${[...instruction].some(c => c === ZWSP) ? 'contains U+200B (invisible)' : 'clean'}`)
    console.log(`  gate decision  : ${gate(instruction, target)}\n`)
  }
  console.log(`writes performed        : ${writes.length}`)
  console.log(`approval cards created  : ${approvalCards.length}`)
  console.log(`instruction texts stored: ${approvalCards.length} (only the escalated one)`)
  console.log('\nThe third write executed on a person the manager never mentioned.')
  console.log('Its instruction text is in no card, no column, no record.')
  console.log('Nothing in the audit trail distinguishes it from a legitimate write.')
}

// ------------------------------------------------------------ mitigation
const INVISIBLE = /[­​-‏‪-‮⁠-⁤﻿]/gu
const HEBREW_POINTS = /[֑-ׇֽֿׁׂׅׄ]/gu
const normalize = s => s.normalize('NFKC').replace(INVISIBLE, '').replace(HEBREW_POINTS, '')

function demoFix() {
  console.log('\n\n=== Part 3: the same attack after normalization ===\n')
  const poisoned = `כיביתי אור${ZWSP}ות ומזגן לפני שיצאתי`
  const before = tokenize(poisoned)
  const after  = tokenize(normalize(poisoned))
  console.log(`tokens before : ${before.join(' | ')}`)
  console.log(`tokens after  : ${after.join(' | ')}`)
  console.log(`match before  : ${before.some(t => prefixStripped(t, 'אור'))}`)
  console.log(`match after   : ${after.some(t => prefixStripped(t, 'אור'))}`)
  console.log('\nNormalization must run before tokenization, not after.')
  console.log('It closes mode 4. It does not touch modes 1 and 3.')
}

reproduceTables()
demoMode4()
demoFix()
