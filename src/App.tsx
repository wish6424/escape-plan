import { useState, createContext, useMemo, useEffect } from 'react'

import Board from './components/Board'
import InputRoom from './components/InputRoom'
import ChatBox from './components/ChatBox'
import GameResult from './components/GameResult'
import PlayerInfos from './components/PlayerInfos'
import { socketMain } from './service/socket'
import BigNotice from './components/BigNotice'

export const GameContext = createContext<any>({})

// socket.on('client_start_game', generateBoard)
// const generateBoard = () => {}

const App = () => {
  // global state: gameData
  const [gameData, setGameData] = useState({
    // connect to server
    socket: socketMain,
    name: '',
    roomID: '',
    showBoard: false,
    playing: false,
    role: '',
    myTurn: false,
    roomData: {},
    gameTime: '0',
    chat: [],
    showPlayerInfos: false,
    playerInfos: {},
    showResult: false,
    result: '',
    isMute: false,
  })

  const [sound, setSound] = useState(false)
  const [soundText, setSoundText] = useState('mute')

  useEffect(() => {
    setGameData((prevGameData) => ({
      ...prevGameData,
      isMute: sound,
    }))
  }, [sound])

  const handleMuteButton = () => {
    setSound(!sound)
    if (sound) setSoundText('mute')
    else setSoundText('unmute')
  }

  const [noticeText, setNoticeText] = useState('')
  const template = document.getElementById('dialog-template')

  const onLog = () => {
    console.log(gameData)
  }

  useEffect(() => {
    gameData.socket.on('connect', () => {
      setGameData((prevGameData) => ({
        //make page refresh on connect
        ...prevGameData,
      }))
    })

    gameData.socket.on('disconnect', () => {
      gameData.socket.emit('player_disconnect', gameData.roomID)
    })

    gameData.socket.on('update_playerInfo', (playerInfos, showPlayerInfos) => {
      if (JSON.stringify(playerInfos) !== '{}') {
        playerInfos[0].socketID === gameData.socket.id
          ? (playerInfos[0].priority = 1)
          : (playerInfos[1].priority = 1)
      }

      setGameData((prevGameData) => ({
        ...prevGameData,
        playerInfos: playerInfos,
        showPlayerInfos: showPlayerInfos,
      }))
      // console.log(playerInfos)
    })

    gameData.socket.on('game_start', (roomData, playerInfos) => {
      // assign role
      let role = ''
      roomData.warder === gameData.socket.id
        ? (role = 'warder')
        : (role = 'prisoner')

      // set priority for playerInfos
      if (JSON.stringify(playerInfos) !== '{}') {
        playerInfos[0].socketID === gameData.socket.id
          ? (playerInfos[0].priority = 1)
          : (playerInfos[1].priority = 1)
      }

      setGameData((prevGameData) => ({
        ...prevGameData,
        roomData: roomData,
        playerInfos: playerInfos,
        showPlayerInfos: true,
        showBoard: true,
        playing: true,
        role: role,
        myTurn: role === 'warder',
      }))
    })

    gameData.socket.on(
      'player_leave_room',
      (socketID, playerInfos, roomData) => {
        // is the player who leave
        if (gameData.socket.id === socketID) {
          setGameData((prevGameData) => ({
            ...prevGameData,
            roomData: {},
            playerInfos: {},
            showPlayerInfos: false,
            showBoard: false,
            playing: false,
            role: '',
            myTurn: false,
            showResult: false,
          }))
        }
        // the opponent leave
        else {
          setGameData((prevGameData) => ({
            ...prevGameData,
            roomData: roomData,
            playerInfos: playerInfos,
            showPlayerInfos: true,
            showBoard: true,
            playing: false,
            role: '',
            myTurn: false,
            showResult: false,
          }))
          setNoticeText(
            'player has left the room ---waiting for new player to join room'
          )
          setTimeout(() => {
            setNoticeText('')
          }, 2000)
        }
      }
    )

    gameData.socket.on('update_roomData', (roomData) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        roomData: roomData,
      }))
    })

    gameData.socket.on('update_showBoard', (showBoard) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        showBoard: showBoard,
      }))
    })

    gameData.socket.on('update_showResult', (showResult) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        showResult: showResult,
      }))
    })

    gameData.socket.on('update_gameOptions', (options) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        options: options,
      }))
    })

    gameData.socket.on('player_won', (role) => {
      console.log(`${role} WON !`)
      setGameData((prevGameData) => ({
        ...prevGameData,
        playing: false,
        showResult: true,
      }))
      // onLog()
    })

    gameData.socket.on('timer', (gameTime) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        gameTime: gameTime,
      }))
    })

    gameData.socket.on('your_turn', () => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        myTurn: true,
      }))
      // console.log('my turn')
    })

    gameData.socket.on('skip_turn', () => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        myTurn: false,
      }))
      // console.log('skip turn')
    })

    gameData.socket.on('result', (result) => {
      setGameData((prevGameData) => ({
        ...prevGameData,
        result: result,
      }))
    })

    return () => {
      //stop duplicate listener
      gameData.socket.off('update_playerInfo')
      gameData.socket.off('game_start')
      gameData.socket.off('player_won')
      gameData.socket.off('player_leave_room')
      gameData.socket.off('timer')
      gameData.socket.off('your_turn')
      gameData.socket.off('skip_turn')
    }
  }, []) // end useEffect

  return (
    // Provide GameContext for the whole app
    <GameContext.Provider value={{ gameData, setGameData }}>
      <div className='flex overflow-hidden w-full h-screen bg-drac_black text-drac_white justify-center items-center font-comfy'>
        {/* Result Screen */}
        {gameData.showResult ? <GameResult role={gameData.role} /> : null}

        {/* Main container */}
        <div className='relative flex grow flex-col max-w-[1024px] justify-center'>
          {/* Game title + inputRoom */}
          <>
            <div className='text-[5vh] text-center'>Escape Plan</div>
            <InputRoom />
          </>

          {/* Game */}
          <div className='relative grid grid-cols-4 gap-[2%]'>
            {/* PlayerInfos */}
            {gameData.showPlayerInfos ? (
              <PlayerInfos
                playerInfos={gameData.playerInfos}
                role={gameData.role}
                playing={gameData.playing}
                myTurn={gameData.myTurn}
              />
            ) : null}

            {/* Board */}
            <div className='col-span-2'>
              {gameData.showBoard ? <Board /> : null}
            </div>

            {/* Chat */}
            {gameData.showBoard ? (
              <ChatBox chatScope={gameData.roomID} />
            ) : null}
          </div>
        </div>

        {/* footer */}
        <div className='fixed flex flex-col bottom-0'>
          <div className='flex flex-row px-8'>
            {/* <button
              className='m-auto py-1 px-2 rounded-full leading-tight bg-amber-500 hover:bg-amber-600 font-bold'
              onClick={onLog}
            >
              LOG gameData
            </button> */}
            <button
              className='m-auto py-1 px-2 rounded-full leading-tight bg-green-500 hover:bg-amber-600 font-bold'
              onClick={handleMuteButton}
            >
              {soundText}
            </button>
          </div>
          <div className='text-center'>
            socket id : {gameData.socket.id} | Room : {gameData.roomID}
          </div>
        </div>
      </div>
      {noticeText !== '' && <BigNotice text={`${noticeText}`}></BigNotice>}
    </GameContext.Provider>
  )
}

export default App
