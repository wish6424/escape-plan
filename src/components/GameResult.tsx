import { RiVipCrownFill } from 'react-icons/ri'
import { useContext, useEffect, useState } from 'react'
import { GameContext } from '../App'

const GameResult = ({ role }: { role: any }) => {
  const { gameData, setGameData } = useContext(GameContext)
  const [ rematchRequest, setRematchRequest ] = useState(false)
  const [ rematchColA,setRematchColA ] = useState("drac_darkgreen") //can't dynamicly change classname to change col gotta use style
  const [ rematchColB,setRematchColB ] = useState("bg-drac_green")
  const [ meRequester,setMeRequester ] = useState(false)

  // if (gameData.showResult) {
  //   playerInfos = playerInfos.sort((a: any, b: any) => b.priority - a.priority)
  //   playerInfos[0]['role'] = role
  //   if (playerInfos.length > 1) {
  //     playerInfos[1]['role'] = role === 'warder' ? 'prisoner' : 'warder'
  //   }
  // }

  var playerInfos = gameData.playerInfos.sort((a: any, b: any) => b.priority - a.priority)
  playerInfos[0]['role'] = role
  if (playerInfos.length > 1) {
    playerInfos[1]['role'] = role === 'warder' ? 'prisoner' : 'warder'
  }

  const onLeave = () => {
    // console.log(`[CLIENT] leaveRoom : ${gameData.roomID}`)
    setGameData({ ...gameData, roomID: '' })
    gameData.socket.emit('leave_room', gameData.roomID)
  }

  const onReMatch = () => {
    gameData.socket.emit('rematch', gameData.roomID)
    // setRematchColA("drac_black")
    // setRematchColB("drac_darkgrey")
    setMeRequester(true)
  }

  useEffect(()=> {
    gameData.socket.on('rematch request', ()=>{
      setRematchRequest(true)
    })
    return () =>{
      gameData.socket.off('rematch request')
    }
  },[])



  if (gameData.showResult)
    return (
      <div
        className='absolute flex grow flex-col top-0 bottom-0 left-0 right-0 
       m-auto p-10 w-1/2 max-w-[700px] h-[60%] max-h-[720px] justify-evenly
       bg-drac_black rounded-xl z-50 border'
      >
        {gameData.result === 'win' && <div className='text-7xl text-center'>VICTORY</div>}
        {gameData.result !== 'win' && <div className='text-7xl text-center'>DEFEAT</div>}
        <div className='grid grid-cols-2 gap-20'>
          {playerInfos.map((playerInfo: any) => {
            return (
              <div
                key={playerInfo.socketID}
                className='grid grid-cols-2 grid-rows-2 break-all '
              >
                <div className='col-span-2 text-3xl m-auto'>
                  {playerInfo.name}
                </div>
                <div className='m-auto text-xl text-center'>
                  <RiVipCrownFill size={28} color='yellow' />
                  {playerInfo.score}
                </div>
                <div className='text-xl m-auto text-center'>
                  {playerInfo.role}
                </div>
              </div>
            )
          })}
        </div>
        <div className='relative flex flex-col'>

          {meRequester ? <p className='text-center w-full p-1'>1/2</p>
          :
          <button 
            className={`result-button bg-${rematchColA} hover:${rematchColB} shadow-md ${rematchColA}/40`}
            onClick={onReMatch}
          >
            <div className='text-center w-full p-1'>
              Play Again?
            </div>
          </button>          
          }

          {rematchRequest && <span className='text-center w-full p-1'>Opponent Requested Rematch</span>}

          <button
            className='result-button max-w-[100px] h-[30px] mt-3
         bg-drac_black shadow-drac_darkgrey/30 hover:bg-drac_darkgrey'
            onClick={onLeave}
          >
            <div className='text-center w-full'>
              leave
            </div>
          </button>
        </div>
      </div>
    )
  else return <div></div>
}

export default GameResult
