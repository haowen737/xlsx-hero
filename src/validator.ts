import asv from 'async-validator'

interface Descriptor {
  [key: string]: any[]
}

export default class Validator {

  private descriptor: Descriptor
  private asv: any
  constructor(
    columns: any[]
  ) {
    this.descriptor = {}
    this.createasv(columns)
  }

  private createasv(columns: any[]) {
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      const { key, rules } = column

      if (rules) {
        this.descriptor[key] = rules
      }
    }
    this.asv = new asv(this.descriptor)
  }

  public validate(row: XlsxCell[], opt: any, callback: any): void {
    return this.asv.validate(row, opt, callback)
  }
}