import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import URL from 'url'
import querystring from 'querystring'

require('bulma')

class UrlHistoryList extends Component {
  constructor() {
      super()
      this.state = {
        marks: {},
        sortedKeys: [],
        scope: 'days',
        loading: true
      }
  }

  normalizeUrl(visit) {
    const url = URL.parse(visit.url)

    const query = querystring.parse(url.query)

    // Shitty junk url stuff
    delete query.ar
    delete query.utm_source
    delete query.tag
    delete query.source
    delete query.hl

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

    if(this.state.renderTimer) clearTimeout(this.state.renderTimer)

    this.state.renderTimer = setTimeout(() => {
      this.state.loading = false;
      this.forceUpdate()
    }, 64)
  }

  componentWillMount() {
    this.loadData()
  }


  adjustMinutes(date, minutes) {
    return date.getTime() + minutes * 60000
  }

  loadData() {
    chrome.storage.sync.get('scope', (storage) => {
      this.setState(Object.assign({}, this.state))
      chrome.tabs.query({}, (tabs) => {
        const activeTabUrls = {}
        tabs.forEach((tab) => {
          const url = tab.url
          activeTabUrls[url] = tab.url
        })

        const now = new Date()
        const scope = { timespan: 60 * 24, lookbehind: 7, slidingWindow: 30 }

        for(var i=0; i <= scope.lookbehind; i++) {
          const startTime = this.adjustMinutes(now, -(scope.timespan * i) - scope.slidingWindow)
          const endTime = this.adjustMinutes(now, -(scope.timespan * i) + scope.slidingWindow)

          chrome.history.search(
            { text: '', maxResults: 10000, startTime: startTime, endTime: endTime },
            (visit) => {
              const visitsWithWeight = visit
                .filter(v => !activeTabUrls[v.url])
                .map(v => Object.assign({}, v, { weight: 1.0 }))
              this.mergeVisits(visitsWithWeight)
            }
          )
        }
      })
    })
  }

  compareWeight(a, b) {
    if (a.weight > b.weight) return -1
    if (a.weight < b.weight) return 1
    return 0
  }

  onScopeChange(newScope) {
    this.setState(Object.assign({}, this.state, { marks: {}, sortedKeys: [], scope: newScope }))
    chrome.storage.sync.set({ scope:  newScope })
    this.loadData()
  }

  render() {
    if(this.state.loading) {
      return (
        <div style={{ height: 50 }}>
          <header className="titleBar">
            <span><strong style={{ color: 'white ' }}>s</strong>marks</span>
          </header>
          <div style={{ marginTop: 50, paddingLeft: 10 }}>
            Loading...
          </div>
        </div>)
    }

    return (
      <div>
        <header className="titleBar">
          <span><strong style={{ color: 'white ' }}>s</strong>marks</span>
        </header>
        <div style={{padding: 10}}>
          {
            this.state.sortedKeys.map((k, index) => {
              var mark = this.state.marks[k]
              return (
                <article className="media" key={index} title={k}>
                  <figure className="media-left">
                    <div className="image is-16x16" style={{ backgroundImage: `-webkit-image-set(url("chrome://favicon/size/16@2x/${mark.url}") 2x)`}}>
                    </div>
                  </figure>
                  <div className="media-content" style={{ width: 250 }}>
                    <div className="content" className="content">
                      <a title={mark.url} href={mark.url} target="_blank" className="linkText">{mark.title}</a>
                    </div>
                  </div>
                </article>
                )
              }
            )
          }
        </div>
      </div>
    )
  }
}

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    (<UrlHistoryList />),
    document.getElementById('root'))
})
