import { useEffect, useRef, useState } from 'react'
import { hyperspace, explosion, earth, moon } from './assets/images'
import { nanoid } from 'nanoid'
import { useKeysStore } from './keysStore'
import gsap from 'gsap'
import type { audio, Wordbank } from './definitions'
import { backgroundTrack, sfxTracks } from './sounds'

const App = () => {

  const { keys, pressKey, resetKeys } = useKeysStore()

  // States running the app
  const [currentWord, setCurrentWord] = useState<string | null>(null)
  const [guessedLetter, setGuessedLetter] = useState<string[]>([])
  const [lives, setLives] = useState(7)
  const [pauseState, setPauseState] = useState(true)
  const [currentScore, setCurrentScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [flip, setFlip] = useState(true)

  const bgMusicRef = useRef(new Audio(backgroundTrack))

  // 
  useEffect(() => {
    if (soundOn) {
      const audio = bgMusicRef.current
      audio.loop = true
      audio.volume = 0.4
      audio.play()

    } else {
      bgMusicRef.current.pause()
      bgMusicRef.current.currentTime = 0
    }
  }, [soundOn])

  function playSfx(track: audio) {
    const sfx = new Audio(track.src)
    sfx.volume = 1.0
    sfx.play()
  }


  const [highScore, setHighScore] = useState(() => {
    // Get stored value
    return localStorage.getItem('highScore') || "0"
  })

  // Loading the list of words from the JSON
  useEffect(() => {
    fetch('/word-bank.json')
      .then(response => response.json())
      .then(data => {
        setCurrentWord(randomWord(data))
      })
      .catch(error => console.error("Error loading JSON", error))
  }, [flip])


  // Ref for the earth div
  const earthRef = useRef<HTMLDivElement>(null)

  // set new high score if new high score
  useEffect(() => {
    // Update local storage whenever high score change changes
    localStorage.setItem('highScore', highScore)
  }, [highScore])


  // random word generator
  function randomWord(something: Wordbank[] | null): string | null {
    if (something) {
      return something[Math.floor(Math.random() * something.length)].word
    }
    return null
  }

  /**
   * Resets the game to the next word. Resets the guessed letters,
   * lives, and keys. Also flips the word.
   */
  function nextRound() {
    resetKeys()
    setFlip(prev => !prev)
    setGuessedLetter([])
    setLives(7)
    playSfx(sfxTracks[2])
  }

  // Check for new high score
  useEffect(() => {
    const num = Number(highScore)
    if (currentScore > num) {
      setHighScore(currentScore.toFixed(0))
    }

  }, [currentScore, highScore])

  // Check for game over
  useEffect(() => {
    if (lives <= 0) {
      gsap.to(earthRef.current, {
        opacity: 0, duration: 1, onComplete: () => {
          playSfx(sfxTracks[3])
          setGameOver(true)
        }
      })

    }
  }, [lives])

  /**
   * Function to handle key press events.
   * @param letter - The letter of the key pressed
   * Checks if the letter is in the currentWord, and if so, adds it to the
   * guessedLetter array and increases the currentScore by the number of lives
   * remaining. If the letter is not in the currentWord, it decreases the number
   * of lives by one.
   */
  const keyPressed = (letter: string) => {
    pressKey(letter)
    if (currentWord?.includes(letter)) {
      setGuessedLetter(prev => prev = [...prev, letter])
      setCurrentScore(prev => prev += 1 * lives)
      if (soundOn) {
        playSfx(sfxTracks[1])
      }

    } else {
      setLives(prev => prev -= 1)
      if (soundOn) {
        playSfx(sfxTracks[4])
      }

    }

  }


  /**
   * A function to generate the word spread based on the currentWord and the
   * guessedLetter array. It iterates over the currentWord and if the letter is
   * in the guessedLetter array, it adds the letter to the word and adds a div
   * with the letter to the divs array. If the letter is not in the
   * guessedLetter array, it adds an underscore to the word and adds a div with
   * an underscore to the divs array. If the word equals the currentWord, it
   * calls the nextRound function.
   * @returns An array of JSX elements representing the word spread.
   */
  const spread = () => {
    const divs = []
    let word: string = ""
    if (currentWord) {
      for (let i = 0; i < currentWord.length; i++) {
        if (guessedLetter.includes(currentWord[i])) {
          word += currentWord[i]
          divs.push(<div
            key={nanoid()}
            className=' flex justify-center text-4xl p-2 min-w-10 bg-white'
          >
            <p>{currentWord[i].toUpperCase()}</p>
          </div>)

        } else {
          word += "_"
          divs.push(<div
            key={nanoid()}
            className=' flex justify-center text-4xl p-2 min-w-10 bg-white'
          >
            <p>_</p>
          </div>)
        }
      }
      if (word === currentWord) {
        nextRound()
      }
    }
    return divs
  }

  /**
   * Resets the game state for a new round. This includes resetting the opacity
   * of the earth, setting the game over state to false, resetting the current
   * score to zero, resetting the keyboard keys, flipping the word, clearing
   * the guessed letters, and restoring the number of lives to the initial value.
   */
  const replay = () => {
    earthRef.current?.setAttribute("style", "opacity: 1;")
    setGameOver(false)
    setCurrentScore(0)
    resetKeys()
    setFlip(prev => !prev)
    setGuessedLetter([])
    setLives(7)
  }

  return (
    <>
      <div
        style={{ backgroundImage: `url(${hyperspace})` }}
        className='relative bg-cover bg-center h-full w-full sm:px-32 flex flex-col items-center pt-10 sm:pt-4 justify-between pb-8'
      >
        {/*  starting menu */}
        {pauseState && <div

          className='absolute flex flex-col gap-10 justify-center items-center top-0 left-0 h-full w-full opacity-90 bg-black z-50'>
          <button
            onClick={() => setPauseState(false)}
            className='text-3xl font-bold bg-white hover:scale-90 px-4 py-2'>Start Game</button>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className='text-3xl font-bold bg-white hover:scale-90 px-4 py-2'>Sound {soundOn ? "on" : "Off"}</button>
          <button
            onClick={() => setPauseState(false)}
            className='text-3xl font-bold bg-white hover:scale-90 px-4 py-2'>Follow me on X</button>
        </div>}

        {gameOver && <div className='absolute top-0 left-0 h-full w-full bg-black z-[100] flex flex-col gap-10 justify-center xl:placeholder:items-center p-4'>
          <p className='text-[1rem] xl:text-2xl text-white font-bold align-middle'>
            I believe the word was "{currentWord}".
          </p>
          <p className='text-[1rem] xl:text-2xl text-white font-bold align-middle'>
            That earth was destroyed by your inability to decipher common "{currentWord}".
          </p>
          <p className='text-[1rem] xl:text-2xl text-white font-bold'>Click the button below and we go to another multiverse. to save another earth from a "{currentWord}".</p>
          <button
            onClick={replay}
            className='text-3xl font-bold bg-white hover:scale-90 px-4 py-2 w-fit'>Another Earth</button>
        </div>}

        {/* score boards */}
        <div className='z-40 absolute left-0 top-0 flex items-center gap-2  ml-4 mt-4'>
          <p className='text-white'>score </p>
          <span className=' text-4xl bg-white text-black font-bold'>{currentScore}</span>
        </div>
        <div className='z-40 absolute right-0 flex items-center top-0 gap-2 mr-4 mt-4'>

          <p className='text-white'>
            high score
          </p>
          <span className=' text-4xl bg-white text-black font-bold'>{highScore}</span>
        </div>

        {/* the tint */}
        <div className='absolute w-full h-full top-0 left-0 bg-black z-10 opacity-50'></div>

        <div
          ref={earthRef}
          className='flex mt-10'>
          <div className=''><img className='w-32 h-32' src={moon} alt="moon" /></div>
          <div className=''><img className='w-60 h-60' src={earth} alt="earth" /></div>
        </div>

        {/* images and props */}
        <div className={` absolute pointer-events-none h-1/2 w-1/2 top-0 left-1/2 mt-10 ${lives > 0 ? "" : "hidden"}`}>
          <img className={`absolute z-30 translate-x-10 w-32 h-32 transition-all duration-[3000ms]  ${lives >= 0 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 translate-x-24 transition-all duration-[3000ms] ${lives > 1 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 -translate-x-32 -rotate-180 translate-y-28 transition-all duration-[3000ms] ${lives > 2 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 -translate-x-20 -rotate-90 translate-y-40 transition-all duration-[3000ms] ${lives > 3 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 translate-x-20 translate-y-40 transition-all duration-[3000ms] ${lives > 4 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 translate-x-5 rotate-180 translate-y-60 transition-all duration-[3000ms] ${lives >= 6 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
          <img className={`absolute z-30 w-14 h-14 -translate-x-20 rotate-[90deg] translate-y-20 transition-all duration-[3000ms] ${lives >= 7 ? "opacity-0" : "opacity-1"}`} src={explosion} alt="" />
        </div>

        {/* the words slates */}
        <div className='z-20 flex gap-2 justify-center items-center flex-wrap w-full'>
          {
            spread()
          }
        </div>

        {/* input slates */}
        <div className='z-20 grid sm:grid-cols-9 grid-cols-7 gap-2'>
          {
            keys.map(key => (
              <button
                onClick={() => keyPressed(key.letter)}
                key={key.id}
                className={`bg-white text-black text-3xl font-bold p-2 hover:text-white hover:bg-black hover:outline-2 hover:outline-white ${key.isPressed ? 'bg-black text-black opacity-40 pointer-events-none' : ''} hover:border-[1px] hover:scale-90 hover:border-white transition-all ease-linear duration-300`}
              >{key.letter.toLocaleUpperCase()}</button>
            ))
          }

        </div>

      </div>
    </>

  )
}

export default App