import React, { Component } from 'react'
import ReactDOM from 'react-dom'

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: false,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0]
    var url = tab.url
    console.assert(typeof url == 'string', 'tab.url should be a string')

    callback(url);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl( url => {
    console.log(url)

    document.getElementById('password').innerText = password

    ReactDOM.render(
      (<div>Hello from React! Your password is: {password}</div>),
      document.getElementById('root'));
  })
});
