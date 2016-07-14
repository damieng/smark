import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class UrlHistoryList extends Component {
  constructor() {
      super();
      this.state = { marks: {}, sortedKeys: [] };
  }

  mergeVisits(visits) {
    const marks = this.state.marks
    visits.filter(f => f.title).forEach(v => {
        if (marks[v.url]) {
          console.log(`adding values for ${v.url} new title ${v.title} old title ${marks[v.url].title}`)
          marks[v.url].weight += v.weight
        } else {
          marks[v.url] = v
        }
      }
    )
    this.state.sortedKeys = Object.keys(this.state.marks).map(k => this.state.marks[k]).sort(this.compareWeight).filter(f => f.weight >= 3).map(k => k.url)
    this.forceUpdate()
  }

  componentWillMount() {
    this.loadData()
  }

  adjustMinutes(date, minutes) {
    return date.getTime() + minutes * 60000
  }

  loadData() {
    const now = new Date('2016-07-13 10:00')
    const days = 60 * 24

    for(var i=0; i <= 7; i++) {
      const startTime = this.adjustMinutes(now, -(days * i) - 30)
      const endTime = this.adjustMinutes(now, -(days * i) + 30)
      chrome.history.search(
        { text: '', maxResults: 10000, startTime: startTime, endTime: endTime },
        (visit) => {
          const visitsWithWeight = visit.map(v => Object.assign({}, v, { weight: 1.0 }));
          this.mergeVisits(visitsWithWeight)
          //console.log(`Visits for ${new Date(startTime)} to ${new Date(endTime)}`)
          //console.log(visit)
        }
      )
    }
  }

  compareWeight(a, b) {
    if (a.weight > b.weight) return -1;
    if (a.weight < b.weight) return 1;
    return 0;
  }

  render() {
    return (
      <div>
        <h4>{this.state.marks.length}</h4>
        <ul>
          {
            this.state.sortedKeys.map((k, index) => {
              var mark = this.state.marks[k]
              return (
                <li key={index}>
                  <a href={k} target="_blank">{mark.title} ({mark.weight})</a>
                </li>
                )
              }
            )
          }
        </ul>
      </div>
    )
  }
}

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    (<UrlHistoryList />),
    document.getElementById('root'));
});
