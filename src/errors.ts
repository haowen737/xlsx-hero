interface ErrConstructor {
  (message?: string): Error
  readonly prototype: Error
  new(message?: string): Error
}

class XlsxHeroErr extends Error {
  public isXlsxHero: boolean
  constructor(msg: string) {
    super(msg)
    this.isXlsxHero = true
    this.name = "xlsxHeroError"
  }
}

export function Err(msg: string) {
  // err.message = msg
  return new XlsxHeroErr(msg)
}
