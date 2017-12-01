const bitcoin = require('bitcoinjs-lib')
const isemail = require('isemail')

function isValidAddress (address, network) {
  try {
    let dec = bitcoin.address.fromBase58Check(address)
    return dec.version === network.pubKeyHash || dec.version === network.scriptHash
  } catch (e) {
    return false
  }
}

function isValidPrivKey (priv, network) {
  throw new Error('Not implemented yet')
}

const tldBlacklist = ['mailinator.com']
function isValidEmail (email) {
  return isemail.validate(email, {tldBlacklist: tldBlacklist})
}

function isValidIdentifier (identifier) {
  // for example 75c1209-dbcac5a6-e040977-64a52ae
  return /^[0-9a-f]{7}-[0-9a-f]{8}-[0-9a-f]{7}-[0-9a-f]{7}$/.test(identifier) || isValidEmail(identifier)
}

function isValidSharedKey (sharedKey) {
  // for example 3944a2806982d40eab55068df19328b3f06f0bce924989099a2cfc21769cc72d91200da16b79a5c6145721e9d2543924
  return /^[0-9a-f]+$/.test(sharedKey)
}

module.exports = {
  isValidEmail: isValidEmail,
  isValidAddress: isValidAddress,
  isValidPrivKey: isValidPrivKey,
  isValidIdentifier: isValidIdentifier,
  isValidSharedKey: isValidSharedKey
}
