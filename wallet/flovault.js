const axios = require('axios')
const callbackify = require('callbackify')
const validation = require('../util').validation

let ax = axios.create({
  baseURL: 'https://flovault.alexandria.io/wallet/'
})

function create (email) {
  if (email !== '' && !validation.isValidEmail(email)) {
    return Promise.reject(new Error('invalid email'))
  }

  return ax.post('create/', {email: email}).then((res) => {
    return Promise.resolve(res.data)
  })
}

function checkLoad (identifier) {
  if (!validation.isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }

  return ax.get('checkload/' + identifier)
    .then(function (response) {
      let data = response.data

      if (data.error) {
        return Promise.reject(data.error)
      }

      if (data.auth_key_isvalid === true) {
        return Promise.resolve(data)
      }

      return Promise.reject(data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'checkload request failed'
      }
      return Promise.reject(ret)
    })
}

function load (identifier) {
  if (!validation.isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }

  return ax.get('load/' + identifier)
    .then(function (response) {
      let data = response.data

      if (data.error !== false) {
        return Promise.reject(data.error)
      }

      return Promise.resolve(data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'load request failed'
      }
      return Promise.reject(ret)
    })
}

function readAccount (identifier, sharedKey) {
  if (!validation.isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }
  if (!validation.isValidSharedKey(sharedKey)) {
    let ret = {
      error: 'malformed sharedKey',
      message: 'malformed sharedKey'
    }
    return Promise.reject(ret)
  }

  return ax.post('read_account/', {identifier: identifier, shared_key: sharedKey})
    .then(function (response) {
      let data = response.data

      if (data.error !== false) {
        return Promise.reject(data)
      }
      return Promise.resolve(data.data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'read_account request failed'
      }
      return Promise.reject(ret)
    })
}

function store (data) {
  if (!validation.isValidIdentifier(data.identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }
  if (!validation.isValidSharedKey(data.shared_key)) {
    let ret = {
      error: 'malformed sharedKey',
      message: 'malformed sharedKey'
    }
    return Promise.reject(ret)
  }

  return ax.post('update/', data)
    .then(function (response) {
      let rdata = response.data

      if (rdata.error !== false) {
        return Promise.reject(rdata)
      }
      return Promise.resolve(rdata)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'wallet/update request failed'
      }
      return Promise.reject(ret)
    })
}

module.exports = {
  create: callbackify(create),
  checkLoad: callbackify(checkLoad),
  load: callbackify(load),
  readAccount: callbackify(readAccount),
  store: callbackify(store)
}
