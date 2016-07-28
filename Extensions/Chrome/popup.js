import React, { Component } from 'react'
import ReactDOM from 'react-dom'

require('bulma');

class UrlHistoryList extends Component {
  constructor() {
      super()
      this.state = { marks: {}, sortedKeys: [] }
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
    chrome.tabs.query({}, (tabs) => {
      const activeUrls = {}
      tabs.forEach((tab) => {
        const url = tab.url;
        activeUrls[url] = tab.url;
      });

      this.loadData(activeUrls)
    })
  }

  adjustMinutes(date, minutes) {
    return date.getTime() + minutes * 60000
  }

  loadData(activeTabUrls) {
    const now = new Date('2016-07-27 10:00')
    //const now = new Date()
    const days = 60 * 24

    for(var i=0; i <= 7; i++) {
      const startTime = this.adjustMinutes(now, -(days * i) - 30)
      const endTime = this.adjustMinutes(now, -(days * i) + 30)

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
  }

  compareWeight(a, b) {
    if (a.weight > b.weight) return -1
    if (a.weight < b.weight) return 1
    return 0
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
    };

    return (
      <div>
        <header style={ styles.titleBar }>
          smarks
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
                      <a title={mark.url} href={mark.url} target="_blank" style={{ borderBottom: '0' }}>{mark.title}</a>
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
