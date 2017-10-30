const coinNetworks = require('../coins/networks/index')
const bitcoin = require('bitcoinjs-lib')

function Key (privKey, coins) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Key.constructor')
    return new Key(...arguments)
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

Key.prototype.addCoin = function (coinName) {
  if (coinNetworks.isSupported(coinName)) {
    if(this.coins[coinName]) {
      return;
    }

    this.coins[coinName] = {}
    this.coins[coinName].network = coinNetworks.getNetwork(coinName)
    this.coins[coinName].ecKey = bitcoin.ECPair.fromWIF(this.privKey, coinNetworks.supportedNetworks)

    // get raw private key and correct network type
    if (this.coins[coinName].ecKey.network.wif !== this.coins[coinName].network.wif) {
      this.coins[coinName].ecKey = new bitcoin.ECPair(this.coins[coinName].ecKey.d, null, {
        compressed: this.coins[coinName].ecKey.compressed,
        network: this.coins[coinName].network
      })
    }

    this.coins[coinName].addresse = this.coins[coinName].ecKey.getAddress().toString()
    this.coins[coinName].balance = 0
    this.coins[coinName].transactions = []
    this.coins[coinName].utxo = []
    this.coins[coinName].stxo = []
  }
}

Key.prototype.getAddress = function (coinName) {
  return this.coins[coinName].addresse
}

Key.prototype.getBalance = function (coinName) {
  return this.coins[coinName].balance
}

Key.prototype.getTransactions = function (coinName) {
  return this.coins[coinName].transactions
}

Key.prototype.getUTXO = function (coinName) {
  return this.coins[coinName].utxo
}

Key.prototype.payTo = function (coinName, address, amount) {
  let coin = this.coins[coinName]

  if (!coin) {
    return {err: "coin doesn't exist"}
  }

  if (coin.balance < amount) {
    return {err: "not enough unspent balance"}
  }

}

Key.prototype.getBestUnspent = function (coin, amount) {
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
    return b.amount - a.amount
  })

  let s = utxos.some((utxo) => {
    subTotal += utxo.amount
    txo.push(utxo)

    if (subTotal > amount) {
      return true
    }
  })

  if (!s) {
    return {err: "not enough unspent balance"}
  } else {
    return {
      err: null,
      subTotal: subTotal,
      txo: txo
    }
  }
}

module.exports = Key
