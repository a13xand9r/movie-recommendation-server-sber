import { pluralization, tvShowName } from './fixTextObjects';

export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())]
}


const changeText = <T extends object>(text: string, changeObj: T) => {
  let newText: string = text
  const keys = Object.keys(changeObj)
  keys.forEach((key) => {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      //@ts-ignore
      newText = text.replace(key, changeObj[key])
      //@ts-ignore
      newText = newText.replace(key.toLowerCase(), changeObj[key].toLowerCase())
    }
  })
  return newText
}

export const fixPluralization = (text: string) => {
  return changeText(text, pluralization)
}
export const fixMovieName = (text: string) => {
  return changeText(text, tvShowName)
}