export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const DOVIZ_PATTERN =
  /^(gram-|ceyrek-|yarim-|tam-|cumhuriyet|ata-|resat-|hamit-|ikibucuk|besli-|gremse-|14-ayar|18-ayar|22-ayar|ons$|gumus$|gram-gumus|gram-platin|gram-paladyum|USD$|EUR$|GBP$|XU100$)/i

export function isDovizTicker(ticker: string): boolean {
  return DOVIZ_PATTERN.test(ticker)
}

export function isCryptoTicker(ticker: string): boolean {
  return ticker.includes("/")
}
