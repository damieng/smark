import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class UrlHistoryList extends Component {
  constructor() {
      super();
      this.state = { visits: [] };
  }

  addVisit(visit) {
    this.setState({
      visits: this.state.visits.concat(visit)
    })
  }

  componentWillMount() {
    const millisecondsInAWeek = 1000 * 60 * 60 * 24 * 7;
    const startTime = Date.now() - millisecondsInAWeek;
    chrome.history.search(
      { text: '', maxResults: 10000, startTime: startTime },
      (visit) => {
        console.log(visit)
        this.addVisit(visit)
      }
    )
  }

  render() {
    return (
      <div>
        <h4>{this.state.visits.length}</h4>
        <ul>
          {
            this.state.visits.map((visit, index) => (
              <li key={index}>
                <a href={visit.url} target="_blank">{visit.title}</a>
              </li>
              )
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
