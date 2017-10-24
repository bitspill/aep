const Insight = require('./insight')
const Transaction = require('bitcoinjs-lib/src/transaction')

let insight = new Insight('https://florinsight.alexandria.io')

// ToDo: Mock the http calls to force situations to test
// https://facebook.github.io/jest/docs/en/mock-functions.html

// post - 01000000019911327cd1ec6177ea865d2772697652f2dd82d451335c9713aea4ef95e18af9000000006b48304502210094d190f7471d6896d8c54e623576b83ad4324d55ef84bac3d621ae166c86c48202205697ef9cc7846635d6acdc0ae0fe1d1c716771688ef38bd9ddbda0e70c726d2f012103d0184409d51a2fcf0e962a30bff6f95afaab468e607ce61ad3fe32af1f404e0affffffff0200ca9a3b000000001976a9144f3a411d38966b259484338306c46924e616b53388ac2036963b000000001976a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac00000000
// return - {"txid": "02c85b5cacecfeede339bb7874f250c7731d986c727283ee0c91cf5c96e52b11"}


test('pushTx duplicate promise', () => {
  expect.assertions(3)
  return insight.pushTX('01000000019911327cd1ec6177ea865d2772697652f2dd82d451335c9713aea4ef95e18af9000000006b48304502210094d190f7471d6896d8c54e623576b83ad4324d55ef84bac3d621ae166c86c48202205697ef9cc7846635d6acdc0ae0fe1d1c716771688ef38bd9ddbda0e70c726d2f012103d0184409d51a2fcf0e962a30bff6f95afaab468e607ce61ad3fe32af1f404e0affffffff0200ca9a3b000000001976a9144f3a411d38966b259484338306c46924e616b53388ac2036963b000000001976a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac00000000').then((res) => {
    expect(res).toBeDefined()
    expect(res.status).toBe(400)
    expect(res.data).toBe('transaction already in block chain (code -27)')
  })
})

test('pushTx duplicate callback', (done) => {
  expect.assertions(3)
  insight.pushTX('01000000019911327cd1ec6177ea865d2772697652f2dd82d451335c9713aea4ef95e18af9000000006b48304502210094d190f7471d6896d8c54e623576b83ad4324d55ef84bac3d621ae166c86c48202205697ef9cc7846635d6acdc0ae0fe1d1c716771688ef38bd9ddbda0e70c726d2f012103d0184409d51a2fcf0e962a30bff6f95afaab468e607ce61ad3fe32af1f404e0affffffff0200ca9a3b000000001976a9144f3a411d38966b259484338306c46924e616b53388ac2036963b000000001976a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac00000000',
    (err, res) => {
      expect(err).toBeDefined()
      expect(err.status).toBe(400)
      expect(err.data).toBe('transaction already in block chain (code -27)')
      done()
    })
})

test('pushTx Transaction object promise', () => {
  expect.assertions(3)
  let tx = new Transaction.fromHex('01000000019911327cd1ec6177ea865d2772697652f2dd82d451335c9713aea4ef95e18af9000000006b48304502210094d190f7471d6896d8c54e623576b83ad4324d55ef84bac3d621ae166c86c48202205697ef9cc7846635d6acdc0ae0fe1d1c716771688ef38bd9ddbda0e70c726d2f012103d0184409d51a2fcf0e962a30bff6f95afaab468e607ce61ad3fe32af1f404e0affffffff0200ca9a3b000000001976a9144f3a411d38966b259484338306c46924e616b53388ac2036963b000000001976a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac00000000')
  return insight.pushTX(tx).then((res) => {
    //console.log(res)
    expect(res).toBeDefined()
    expect(res.status).toBe(400)
    expect(res.data).toBe('transaction already in block chain (code -27)')
  })
})

test('pushTx Transaction object duplicate callback', (done) => {
  expect.assertions(3)
  let tx = new Transaction.fromHex('01000000019911327cd1ec6177ea865d2772697652f2dd82d451335c9713aea4ef95e18af9000000006b48304502210094d190f7471d6896d8c54e623576b83ad4324d55ef84bac3d621ae166c86c48202205697ef9cc7846635d6acdc0ae0fe1d1c716771688ef38bd9ddbda0e70c726d2f012103d0184409d51a2fcf0e962a30bff6f95afaab468e607ce61ad3fe32af1f404e0affffffff0200ca9a3b000000001976a9144f3a411d38966b259484338306c46924e616b53388ac2036963b000000001976a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac00000000')
  insight.pushTX(tx,
    (err, res) => {
      expect(err).toBeDefined()
      expect(err.status).toBe(400)
      expect(err.data).toBe('transaction already in block chain (code -27)')
      done()
    })
})