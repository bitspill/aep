const CryptoJS = require('crypto-js')
const wallet = require('./wallet')
const isValidAddress = require('../util').validation.isValidAddress
const networks = require('../coins/networks')

// ToDo: Mock Insight for these tests, currently fragile as they depend upon actual data

test.skip('new wallet creation', () => {
  // Skipped to prevent flooding DB with new accounts
  expect.hasAssertions()

  return wallet.createNewWallet({
    email: '',
    password: 'aepTestWallet',
    coins: ['florincoin', 'litecoin'],
    defaultCrypto: 'litecoin'
  }).then((wal) => {
    expect(wal).toBeDefined()
    expect(wal.keys.length).toBe(1)
    expect(wal.defaultCrypto).toBe('litecoin')
  })
})

test('wallet constructor', () => {
  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')
  expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
  expect(wal.password).toBe('PublicDevAccount')
})

test('wallet load', () => {
  expect.hasAssertions()

  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
    expect(wal.password).toBe('PublicDevAccount')
    expect(wal.defaultCrypto).toBe('florincoin')
    expect(wal.cryptoConfig).toEqual({
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Iso10126,
      iterations: 5
    })
  })
})

test.skip('wallet refresh balance', () => {
  jest.setTimeout(30 * 1000)
  expect.hasAssertions()

  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refreshBalances().then(() => {
      expect(wal).toBeDefined()
      expect(wal.keys[0].coins['florincoin'].balanceSat).toBe(1199600000)
    })
  })
})

test.skip('wallet refresh', () => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refresh().then(() => {
      expect(wal.keys[0].getBalanceSat('florincoin')).toBe(1199600000)
      expect(wal.keys[0].getBalanceSat('bitcoin_testnet')).toBe(223726225)
      expect(wal.keys[0].getUTXO('florincoin')).toEqual([{
        'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
        'amount': 2,
        'confirmations': 6,
        'confirmationsFromCache': true,
        'satoshis': 200000000,
        'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
        'ts': 1510361925,
        'txid': '58b90b1cb006c45f3d7d67fa2eeb9e6ee53b6dce75b382e3c67f3944ecb83b18',
        'vout': 0
      }, {
        'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
        'amount': 1,
        'confirmations': 6,
        'confirmationsFromCache': true,
        'satoshis': 100000000,
        'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
        'ts': 1510361925,
        'txid': '8362e54bb19e917fa9678d0f36bd1e19f47573fd2a1e8990629ffb818e0bf97b',
        'vout': 0
      }, {
        'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
        'amount': 8.996,
        'confirmations': 6,
        'confirmationsFromCache': true,
        'satoshis': 899600000,
        'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
        'ts': 1510069808,
        'txid': 'cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a',
        'vout': 1
      }])
      expect(wal.keys[0].getUTXO('bitcoin_testnet').length).toBe(3)
    })
  })
})

test('wallet store', () => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refresh().then(() => {
      return wal.store().then((res) => {
        console.log(res)
        expect(res).toBeDefined()
        expect(res.error).toBe(false)
      })
    })
  })
})

test('wallet new address', () => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new wallet.Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    let a = wal.newAddress('florincoin')

    let net = networks.getNetwork('florincoin')
    expect(isValidAddress(a, net)).toBe(true)
  })
})
