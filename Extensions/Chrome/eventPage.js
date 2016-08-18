import URL from 'url'
import querystring from 'querystring'

module.exports = class HistoryState {
  loaded = new Date().toString()
  marks = {}
  sortedKeys = []

  normalizeUrl(visit) {
    const url = URL.parse(visit.url)

    const query = querystring.parse(url.query)

    delete query.ar
    delete query.utm_source
    delete query.tag
    delete query.source

    const search = '?' + querystring.stringify(query)
    url.search = (search.length > 1) ? search : ''

    return url.format()
  }

  mergeVisits(visits) {
    const marks = this.state.marks
    visits.filter(f => f.title && f.url).forEach(v => {
        v.key = this.normalizeUrl(v)
        if (marks[v.key]) {
          marks[v.key].weight += v.weight
        } else {
          marks[v.key] = v
        }
      }
    )

    this.state.sortedKeys = Object.keys(this.state.marks)
      .map(k => this.state.marks[k])
      .sort(this.compareWeight)
      .map(v => v.key)
  }

  adjustMinutes(date, minutes) {
    return date.getTime() + minutes * 60000
  }

  recalculate() {
    chrome.storage.sync.get('scope', (storage) => {
      this.setState(Object.assign({}, this.state, { scope: storage.scope || 'days' }))

      const now = new Date()
      const scope = { timespan: 60 * 24, lookbehind: 7, slidingWindow: 30 }

      for(var i=0; i <= scope.lookbehind; i++) {
        const startTime = this.adjustMinutes(now, -(scope.timespan * i) - scope.slidingWindow)
        const endTime = this.adjustMinutes(now, -(scope.timespan * i) + scope.slidingWindow)

        chrome.history.search(
          { text: '', maxResults: 10000, startTime: startTime, endTime: endTime },
          (visit) => {
            const visitsWithWeight = visit
              .map(v => Object.assign({}, v, { weight: 1.0 }))
            this.mergeVisits(visitsWithWeight)
          }
        )
      }
    })
  }

  compareWeight(a, b) {
    if (a.weight > b.weight) return -1
    if (a.weight < b.weight) return 1
    return 0
  }
}
