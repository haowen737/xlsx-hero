import av from 'async-validator'

interface Descriptor {
  [key: string]: any[]
}

export default class Validator {

  private descriptor: Descriptor
  private av: any
  constructor(
    columns: any[]
  ) {
    this.descriptor = {}
    this.createAv(columns)
  }

  private createAv(columns: any[]) {
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      const { key, rules } = column

      if (rules) {
        this.descriptor[key] = rules
      }
    }
    this.av = new av(this.descriptor)
  }

  public validate(row: XlsxCell[], opt: any, callback: any): void {
    return this.av.validate(row, opt, callback)
  }
}