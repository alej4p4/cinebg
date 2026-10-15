export const isTVDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNB]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation 4|PlayStation 5|Large Screen/i.test(
    ua,
  )
}
