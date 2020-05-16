'use strict'

const { jsdom } = require('jsdom-jscore-rn')

class HtmlTableToJson {
  constructor (html, opts = {}) {
    if (typeof html !== 'string') { throw new TypeError('html input must be a string') }

    this.html = html
    this.opts = opts

    this._dom = new jsdom(this.html)
    this._results = []
    this._headers = []
    this._count = null

    this._firstRowUsedAsHeaders = []

    this._process()
  }

  static parse (html, opts) {
    return new HtmlTableToJson(html, opts)
  }

  get count () {
    return Number.isInteger(this._count) ? this._count : (this._count = this._dom.getElementsByTagName('table').length)
  }

  get results () {
    return this.opts.values === true
      ? this._results.map(result => result.map(Object.values))
      : this._results
  }

  get headers () {
    return this._headers
  }

  _process () {
    if (this._results.length) { return this._results }
    
    var tables = this._dom.getElementsByTagName('table')
    for (var i = 0; i < tables.length; i++) {
      this._processTable(i, tables[i])
    }

    return this._results
  }

  _processTable (tableIndex, table) {
    this._results[tableIndex] = []
    this._buildHeaders(tableIndex, table)

    var rows = table.getElementsByTagName('tr')
    for (var i = 0; i < rows.length; i++) {
      this._processRow(tableIndex, i, rows[i])
    }

    this._pruneEmptyRows(tableIndex)
  }

  _processRow (tableIndex, index, row) {
    if (index === 0 && this._firstRowUsedAsHeaders[tableIndex] === true) return

    this._results[tableIndex][index] = {}

    var data = row.getElementsByTagName('td')
    for (var i = 0; i < data.length; i++) {
      this._results[tableIndex][index][this._headers[tableIndex][i] || (i + 1)] = this.opts.htmlCells ? data[i].innerHTML.trim() : data[i].textContent.trim()
    }
  }

  _buildHeaders (index, table) {
    this._headers[index] = []

    var rows = table.getElementsByTagName('tr')
    for (var i = 0; i < rows.length; i++) {
      var data = rows[i].getElementsByTagName('th')
      for (var j = 0; j < data.length; j++) {
        this._headers[index][j] = data[j].textContent.trim()
      }
    }

    if (this._headers[index].length) return

    this._firstRowUsedAsHeaders[index] = true
    var firstRowData = rows[0].getElementsByTagName('td')
    for (var j = 0; j < firstRowData.length; j++) {
      this._headers[index][j] = firstRowData[j].textContent.trim()
    }
  }

  _pruneEmptyRows (tableIndex) {
    this._results[tableIndex] = this._results[tableIndex].filter(t => Object.keys(t).length)
  }
}

module.exports = HtmlTableToJson
