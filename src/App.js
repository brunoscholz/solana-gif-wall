import React, { useEffect, useState } from 'react'

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor'

import kp from './keypair.json'

import twitterLogo from './assets/twitter-logo.svg'
import './App.css'

// Constants
const TWITTER_HANDLE = '_buildspace'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

// const TEST_GIFS = [
//   'https://media0.giphy.com/media/Mag2rNk7lrIaq6ToOL/giphy.gif?cid=ecf05e47t277qapjqgcufh7c8zquhs1mqdc9jcarixjb4eey&rid=giphy.gif&ct=g',
//   'https://media1.giphy.com/media/BUbMgQBShZOcMPohgn/giphy.gif?cid=ecf05e475htuepmay1f0q92ycxrndu6geni33q1o4r8tr2kn&rid=giphy.gif&ct=g',
//   'https://media4.giphy.com/media/YKFR0dauxYEzJA8J6U/giphy.gif?cid=ecf05e475htuepmay1f0q92ycxrndu6geni33q1o4r8tr2kn&rid=giphy.gif&ct=g',
//   'https://media4.giphy.com/media/BdghqxNFV4efm/giphy.gif?cid=ecf05e477f3czwd010893bb98sw0yj88qxshgq4y2vadg39w&rid=giphy.gif&ct=g'
// ]

const { SystemProgram } = web3

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
console.log(baseAccount.publicKey.toString())
// let baseAccount = web3.Keypair.generate();

const programID = new PublicKey('2PDwSrZk8h2D371iGmzcvdFctoF5jD6BuwiqjKeAWaua')
const network = clusterApiUrl('devnet')
const opts = {
  preflightCommitment: 'processed'
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])

  const checkIfWalletIsConnected = async () => {
    if (window?.solana?.isPhantom) {
      console.log('Phantom wallet found!')

      const response = await window.solana.connect({ onlyIfTrusted: true })
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻')
    }
  }

  const connectWallet = async () => {
    const { solana } = window

    if (solana) {
      const response = await solana.connect()
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }
  }

  const renderNotConnectedContainer = () => (
    <button className='cta-button connect-wallet-button' onClick={connectWallet}>
      Connect to Wallet
    </button>
  )

  const onInputChange = event => {
    const { value } = event.target
    setInputValue(value)
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log('No gif link given!')
      return
    }
    setInputValue('')
    console.log('Gif link:', inputValue)
    try {
      const provider = getProvider()
      const program = await getProgram()

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      })
      console.log('GIF successfully sent to program', inputValue)

      await getGifList()
    } catch (error) {
      console.log('Error sending GIF:', error)
    }
  }

  const upvote = async (ev, id) => {
    ev.preventDefault()
    try {
      const program = await getProgram()

      const value = new BN(id)
      await program.rpc.addVote(value, {
        accounts: {
          baseAccount: baseAccount.publicKey
        }
      })
      console.log('Upvote on #', id, ', sent to program')

      await getGifList()
    } catch (error) {
      console.log('Error sending GIF:', error)
    }
  }

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className='connected-container'>
          <form
            onSubmit={event => {
              event.preventDefault()
              sendGif()
            }}
          >
            <input type='text' placeholder='Enter gif link!' value={inputValue} onChange={onInputChange} />
            <button type='submit' className='cta-button submit-gif-button'>
              Submit
            </button>
          </form>

          <div className='cards'>
            {/* <div className='gif-grid'> */}
            {gifList.map((gif, idx) => (
              <div className='card' key={idx} onClick={showCard}>
                <div className='card__image-holder' style={{ backgroundImage: `url(${gif.gifLink})` }}>
                  {/* <img className='card__image' src={gif.gifLink} alt={gif.gifLink} /> */}
                </div>
                <div className='card-title'>
                  <a href='/#' className='toggle-info btn'>
                    <span className='left'></span>
                    <span className='right'></span>
                  </a>
                  <h2>
                    Upvotes
                    <small>{gif.upvoteCount.toString()}</small>
                  </h2>
                </div>
                <div className='card-flap flap1'>
                  <div className='card-description'>
                    posted by: <em>{gif.userAddress.toString()}</em>
                  </div>
                  <div className='card-flap flap2'>
                    <div className='card-actions'>
                      <a href='/#' className='btn' onClick={ev => upvote(ev, idx)}>
                        Upvote
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  var zindex = 10
  const showCard = ev => {
    ev.preventDefault()
    var isShowing = false

    const card = ev.target.closest('div.card')
    if (card.classList.contains('show')) {
      isShowing = true
    }

    const wrapper = document.querySelector('div.cards')

    if (wrapper.classList.contains('showing')) {
      // a card is already in view
      const showOff = document.querySelector('div.card.show')
      showOff.classList.remove('show')

      if (isShowing) {
        // this card was showing - reset the grid
        wrapper.classList.remove('showing')
      } else {
        // this card isn't showing - get in with it
        card.classList.add('show')
        card.style.zIndex = zindex
      }
      zindex++
    } else {
      // no cards in view
      wrapper.classList.add('showing')
      card.classList.add('show')
      card.style.zIndex = zindex
      zindex++
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)
    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = await getProgram()

      console.log('ping')
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      })
      console.log('Created a new BaseAccount w/ address:', baseAccount.publicKey.toString())
      await getGifList()
    } catch (error) {
      console.log('Error creating BaseAccount account:', error)
    }
  }

  const getProgram = async () => {
    // Get metadata about your solana program
    const idl = await Program.fetchIdl(programID, getProvider())
    // Create a program that you can call
    return new Program(idl, programID, getProvider())
  }

  const getGifList = async () => {
    try {
      const program = await getProgram()
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log('Got the account', account)
      setGifList(account.gifList)
    } catch (error) {
      console.log('Error in getGifList: ', error)
      setGifList(null)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...')
      getGifList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress])

  return (
    <div className='App'>
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className='header-container'>
          <p className='header'>🖼 GIF Portal</p>
          <p className='sub-text'>View your GIF collection in the metaverse ✨</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App

// https://media0.giphy.com/media/QS0KOjNRG0tfG/giphy.gif?cid=ecf05e47zdz3ufitfq8xe3k4c1cqv72ju12ss4s9x21qtiqo&rid=giphy.gif&ct=g
