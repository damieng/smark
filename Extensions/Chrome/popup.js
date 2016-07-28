import React, { Component } from 'react'
import ReactDOM from 'react-dom'

require('bulma')

class UrlHistoryList extends Component {
  constructor() {
      super()
      this.state = {
        marks: {},
        sortedKeys: [],
        scope: 'days'
      }
  }

  mergeVisits(visits) {
    const marks = this.state.marks
    visits.filter(f => f.title).forEach(v => {
        if (marks[v.url]) {
          marks[v.url].weight += v.weight
        } else {
          marks[v.url] = v
        }
      }
    )

    this.state.sortedKeys = Object.keys(this.state.marks)
      .map(k => this.state.marks[k])
      .sort(this.compareWeight)
      .map(k => k.url)

    this.forceUpdate()
  }

  componentWillMount() {
    this.loadData()
  }


  adjustMinutes(date, minutes) {
    return date.getTime() + minutes * 60000
  }

  loadData() {
    chrome.storage.sync.get('scope', (storage) => {
      this.setState(Object.assign({}, this.state, { scope: storage.scope }))
      chrome.tabs.query({}, (tabs) => {
        const activeTabUrls = {}
        tabs.forEach((tab) => {
          const url = tab.url
          activeTabUrls[url] = tab.url
        })

        const now = new Date()
        const scopes = {
          days: { timespan: 60 * 24, lookbehind: 7, slidingWindow: 30 },
          hours: { timespan: 60, lookbehind: 12, slidingWindow: 30 },
          minutes: { timespan: 1, lookbehind: 30, slidingWindow: 15 }
        }

        const scope = scopes[this.state.scope]

        for(var i=0; i <= scope.lookbehind; i++) {
          const startTime = this.adjustMinutes(now, -(scope.timespan * i) - scope.slidingWindow)
          const endTime = this.adjustMinutes(now, -(scope.timespan * i) + scope.slidingWindow)

          chrome.history.search(
            { text: '', maxResults: 10000, startTime: startTime, endTime: endTime },
            (visit) => {
              console.log(visit)
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
    const styles = {
      content: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        width: '100%',
        overflow: 'hidden',
        lineHeight: '1.2em'
      },
      scopeDropdown: {
        marginLeft: 110
      },
      titleBar: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#1fc8db',
        color: 'white',
        zIndex: 100,
        fontWeight: 300,
        fontSize: 28,
        paddingLeft: 10
      }
    }

    return (
      <div>
        <header style={ styles.titleBar }>
          smarks
          <select value={ this.state.scope } style={ styles.scopeDropdown } onChange={(event) => this.onScopeChange(event.target.value)}>
            <option value='days'>days</option>
            <option value='hours'>hours</option>
            <option value='minutes'>minutes</option>
          </select>
        </header>
        <div style={{padding: 10, marginTop: 40 }}>
          {
            this.state.sortedKeys.map((k, index) => {
              var mark = this.state.marks[k]
              return (
                <article className="media" key={index}>
                  <figure className="media-left">
                    <div className="image is-16x16" style={{ backgroundImage: `-webkit-image-set(url("chrome://favicon/size/16@2x/${mark.url}") 2x)`}}>
                    </div>
                  </figure>
                  <div className="media-content" style={{ width: 250 }}>
                    <div className="content" style={styles.content}>
                      <a title={mark.url} href={mark.url} target="_blank" style={{ borderBottom: '0px' }}>{mark.title}</a>
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
