const coinNetworks = require('../coins/networks')
const util = require('../util')
const isValidAddress = util.validation.isValidAddress
const bitcoin = require('bitcoinjs-lib')
const callbackify = require('callbackify')
const Coin = require('./coin')

function Key (privKey, coins) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Key.constructor')
    return new Key(...arguments)
  }

  if (privKey instanceof Object && coins === undefined) {
    return this.fromDK(privKey)
  }

  this.privKey = privKey
  this.coins = {}

  if (Array.isArray(coins)) {
    if (coins.length > 0) {
      coins.forEach((coin) => {
        this.addCoin(coin)
      })
    } else {
      this.addCoin('florincoin')
    }
  } else if (typeof coins === 'string') {
    this.addCoin(coins)
  } else {
    this.addCoin('florincoin')
  }
}

Key.prototype.fromDK = function (dk) {
  this.privKey = dk.privKey
  this.coins = {}

  for (let c in dk.coins) {
    if (dk.coins.hasOwnProperty(c)) {
      c = dk.coins[c]
      this.coins[c.coinName] = new Coin(c.coinName, c.privKey, c.stxo)
    }
  }
}

Key.prototype.addCoin = function (coinName) {
  if (coinNetworks.isSupported(coinName)) {
    if (this.coins[coinName]) {
      return
    }

    this.coins[coinName] = new Coin(coinName, this.privKey)
  }
}

Key.prototype.hasCoin = function (coinName) {
  return this.coins[coinName] !== undefined
}

Key.prototype.getAddress = function (coinName) {
  return this.coins[coinName].address
}

Key.prototype.getBalance = function (coinName) {
  return this.coins[coinName].balanceSat / this.coins[coinName].coinInfo.satPerCoin
}

Key.prototype.getBalanceSat = function (coinName) {
  return this.coins[coinName].balanceSat
}

Key.prototype.getTransactions = function (coinName) {
  return this.coins[coinName].transactions
}

Key.prototype.getUTXO = function (coinName) {
  return this.coins[coinName].utxo
}

Key.prototype.getNameFromAddress = function (addr) {
  for (let c in this.coins) {
    if (this.coins.hasOwnProperty(c)) {
      if (c === addr || this.coins[c].address === addr) {
        return c
      }
    }
  }
  return ''
}

Key.prototype.containsAddress = function (addr) {
  return this.getNameFromAddress(addr) !== ''
}

Key.prototype.signMessage = function (addr, message) {
  let name = this.getNameFromAddress(addr)
  if (name !== '') {
    return this.coins[name].signMessage(message)
  }
}

Key.prototype.verifyMessage = function (addr, message, signature) {
  let name = this.getNameFromAddress(addr)
  if (name !== '') {
    return this.coins[name].verifyMessage(message, signature)
  }
}

Key.prototype.payTo = callbackify.variadic(function (coinName, address, amount, fee, txComment) {
  let outputs = {}
  outputs[address] = amount
  return this.payToMulti(coinName, outputs, fee, txComment)
})

Key.prototype.payToMulti = callbackify.variadic(function (coinName, outputs, fee, txComment) {
  if (typeof fee === 'string') {
    txComment = fee
    fee = undefined
  }

  if (coinName === 'florincoin') {
    txComment = txComment || ''
  } else {
    txComment = ''
  }

  let coin = this.coins[coinName]

  if (!coin) {
    return Promise.reject(new Error('coin doesn\'t exist'))
  }

  let amountSat = 0
  for (let o in outputs) {
    if (!outputs.hasOwnProperty(o)) {
      continue
    }

    if (!isValidAddress(o, coin.coinInfo.network)) {
      return Promise.reject(new Error('invalid address'))
    }

    // convert amounts to satoshi
    let sat = Math.floor(outputs[o] * coin.coinInfo.satPerCoin)
    if (sat < coin.coinInfo.dust) {
      return Promise.reject(new Error('transaction contains dust output ' + sat + ' sat to ' + o))
    }
    amountSat += sat
    outputs[o] = sat
  }
  let feeSat = Math.floor((fee * coin.coinInfo.satPerCoin) || coin.coinInfo.minFee)

  if (coin.balanceSat < amountSat + feeSat) {
    return Promise.reject(new Error('not enough unspent balance on key'))
  }

  let inputs = this.getBestUnspent(coin, amountSat + feeSat)

  if (inputs.err !== null) {
    return Promise.reject(inputs)
  }

  let tx = new bitcoin.TransactionBuilder(coin.coinInfo.network, coin.coinInfo.maxFeePerByte)
  tx.setVersion(coin.coinInfo.txVersion)

  let spentInputs = []
  for (let input of inputs.txo) {
    tx.addInput(input.txid, input.vout)
    spentInputs.push(input.txid)
  }

  for (let o in outputs) {
    if (!outputs.hasOwnProperty(o)) {
      continue
    }

    // if paying self don't create extra outputs
    if (o !== coin.address) {
      tx.addOutput(o, outputs[o])
    } else {
      amountSat -= outputs[o]
    }
  }

  let calcFee = coin.coinInfo.estimateFee(tx.buildIncomplete(), txComment.length)
  if (fee !== undefined) {
    calcFee = Math.max(calcFee, feeSat)
  }

  if (calcFee < coin.coinInfo.minFee) {
    return Promise.reject(new Error('fee is too low for network ' + calcFee + ' sat'))
  }

  let changeSat = inputs.subTotal - amountSat - calcFee

  if (changeSat < 0) {
    return Promise.reject(new Error('attempted to spend more than available'))
  }

  if (changeSat < coin.coinInfo.dust) {
    // if change would be dust add it to the fee
    changeSat = 0
  }

  let changeVout
  if (changeSat > 0) {
    changeVout = tx.addOutput(coin.address, changeSat)
  }

  for (let i = 0; i < inputs.txo.length; i++) {
    tx.sign(i, coin.ecKey)
  }

  let rawTx = tx.build().toHex()

  if (txComment !== '') {
    rawTx += bitcoin.bufferutils.varIntBuffer(txComment.length).toString('hex') + Buffer.from(txComment).toString('hex')
  }

  return coin.coinInfo.explorer.pushTX(rawTx).then((res) => {
    if (res.txid && changeVout !== undefined) {
      coin.addUnconfirmed(res.txid, changeVout, changeSat / coin.coinInfo.satPerCoin, changeSat, spentInputs)
    }
    return Promise.resolve(res)
  })
})

Key.prototype.getBestUnspent = function (coin, amountSat) {
  let subTotal = 0
  let txo = []

  let utxos = coin.utxo.sort((a, b) => {
    // Sort first by confirmations then amount + to -
    if (a.confirmations < b.confirmations) {
      return -1
    }
    if (a.confirmations > b.confirmations) {
      return 1
    }
    return b.satoshis - a.satoshis
  })

  let s = utxos.some((utxo) => {
    subTotal += utxo.satoshis
    txo.push(utxo)

    if (subTotal >= amountSat) {
      return true
    }
  })

  if (!s) {
    return {err: 'not enough unspent balance'}
  } else {
    return {
      err: null,
      subTotal: subTotal,
      txo: txo
    }
  }
}

Key.prototype.refreshBalance = callbackify(function () {
  let p = []

  for (let c in this.coins) {
    if (!this.coins.hasOwnProperty(c)) {
      continue
    }
    let coin = this.coins[c]
    p.push(coin.coinInfo.explorer.getBalance(coin.address).then((res) => {
      this.coins[c].balanceSat = res.balanceSat
      return Promise.resolve({coinName: c, res: res})
    }))
  }

  return Promise.allSettled(p)
})

Key.prototype.refreshUnspent = callbackify(function () {
  let p = []

  for (let c in this.coins) {
    if (!this.coins.hasOwnProperty(c)) {
      continue
    }
    let coin = this.coins[c]
    p.push(coin.coinInfo.explorer.getUnspent(coin.address).then((res) => {
      this.coins[c].utxo = res
      coin.mergeTxo()
      return Promise.resolve({coinName: c, utxo: coin.utxo})
    }))
  }

  return Promise.allSettled(p)
})

if (!Promise.allSettled) {
  Promise.allSettled = function (promises) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
      state: 'fulfilled',
      value: v
    }), r => ({
      state: 'rejected',
      reason: r
    }))))
  }
}

module.exports = Key
