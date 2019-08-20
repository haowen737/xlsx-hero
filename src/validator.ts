import asv from "async-validator"
import debug from 'debug'

interface Descriptor {
  [key: string]: any[]
}

const DEBUG = debug('xlsx-hero:validator')

export default class Validator {

  private descriptor: Descriptor
  private asv: any
  private first?: boolean
  private concurrentLimit: number

  constructor(
    columns: any[],
    first?: boolean,
  ) {
    this.descriptor = {}
    this.first = first
    this.createasv(columns)
    this.concurrentLimit = 10
    DEBUG('validator created')
  }

  /**
   * TODO: 分批校验，起10个线程
   * 或者可以将 新建worker数量交给用户？🤔
   * @memberof Validator
   */
  public async smoothValidate(data: any[]) {
    const tasksLength = data.length

  }

  public validate(row: XlsxRow, opt: any, callback: any): void {
    return this.asv.validate(row, opt, callback)
  }

  /**
   * 校验每一行，promise包装validator.validator
   *
   * @param {XlsxRow} row
   * @param {number} i
   * @param {number} datasCount
   * @returns
   * @memberof Validator
   */
  public validateRow(row: XlsxRow, i: number, datasCount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validate(row, { first: this.first }, (err: Error, fields: any) => {
        if (!err) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  private createasv(columns: any[]) {
    for (const column of columns) {
      const { key, rules } = column
      if (rules) {
        this.descriptor[key] = rules
      }
    }
    this.asv = new asv(this.descriptor)
  }
}
