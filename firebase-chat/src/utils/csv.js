export function escapeCsvCell(value) {
  if (value == null) return ''

  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

export function rowsToCsv(rows, columns) {
  const header = columns.map((column) => escapeCsvCell(column)).join(',')
  const body = rows
    .map((row) => columns.map((column) => escapeCsvCell(row[column])).join(','))
    .join('\n')

  return `${header}\n${body}`
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function serializeForCsv(value) {
  if (value == null) return ''

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate().toISOString()
    }

    return JSON.stringify(value)
  }

  return value
}
