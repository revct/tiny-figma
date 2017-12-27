

export const pickRandom = <T>(ts: T[]): T => {
  const i = Math.floor(Math.random() * ts.length)
  return ts[i]
}

export const createPicker = <T>(ts: T[]): () => T => {
  let i = 0
  return () => ts[(i ++) % ts.length]
}

export const randomColorPicker = createPicker([
  '#aaf',
  '#faa',
  '#afa',
  '#ffa',
  '#faf',
  '#aff'
])