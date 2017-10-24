const axios = require('axios')
const prepareCallback = require('./prepareCallback')

let ax = axios.create()

function simplePOST (url, data, callback) {
  callback = prepareCallback(callback)

  return ax.request({url: url, method: "POST", data: data, validateStatus: function (status) { return true; }})
    .then(function (res) {
      if (res.status === 200){
        callback(null, res)
      } else {
        callback(res, null)
      }
      return Promise.resolve(res)
    }).catch(function(res) {
      console.log(res);
      callback(res, null)
      return Promise.reject(res)
    })
}

module.exports = simplePOST
