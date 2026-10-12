import React from 'react'

// Turns plain typed text into a clean, structured layout (no HTML is ever injected):
//   blank line        → new paragraph        (single new line stays a line break)
//   "- item" / "• item" → bullet list
//   "1. item"          → numbered list
//   "# Heading"        → sub-heading
//   "**bold**"         → bold
function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={keyBase + i} className="font-bold">{part.slice(2, -2)}</strong>
      : <React.Fragment key={keyBase + i}>{part}</React.Fragment>
  )
}

const BULLET = /^\s*[-•*]\s+(.*)$/
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/
const HEAD = /^\s*#{1,3}\s+(.*)$/

export function parseBlocks(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = null
  let list = null
  const flush = () => { para = null; list = null }

  lines.forEach((line) => {
    if (!line.trim()) return flush()
    let m
    if ((m = line.match(HEAD))) { flush(); blocks.push({ kind: 'head', text: m[1] }); return }
    if ((m = line.match(BULLET))) {
      if (!list || list.kind !== 'bullets') { flush(); list = { kind: 'bullets', items: [] }; blocks.push(list) }
      list.items.push(m[1]); para = null; return
    }
    if ((m = line.match(NUMBER))) {
      if (!list || list.kind !== 'numbers') { flush(); list = { kind: 'numbers', items: [] }; blocks.push(list) }
      list.items.push({ n: m[1], text: m[2] }); para = null; return
    }
    list = null
    if (!para) { para = { kind: 'para', lines: [] }; blocks.push(para) }
    para.lines.push(line)
  })
  return blocks
}

export default function RichText({ text, className = '' }) {
  const blocks = parseBlocks(text)
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === 'head') {
          return <p key={i} className="font-display font-bold text-white mt-3 mb-1 first:mt-0">{inline(b.text, `h${i}`)}</p>
        }
        if (b.kind === 'bullets') {
          return (
            <ul key={i} className="my-2 space-y-1.5 first:mt-0 last:mb-0">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5 items-start">
                  <span className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                  <span className="min-w-0 break-words">{inline(it, `b${i}${j}`)}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (b.kind === 'numbers') {
          return (
            <ol key={i} className="my-2 space-y-1.5 first:mt-0 last:mb-0">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5 items-start">
                  <span className="mt-[0.1em] w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center shrink-0">{it.n}</span>
                  <span className="min-w-0 break-words">{inline(it.text, `n${i}${j}`)}</span>
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="mb-2.5 last:mb-0 break-words">
            {b.lines.map((ln, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {inline(ln, `p${i}${j}`)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
