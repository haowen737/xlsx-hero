import xlsx from 'node-xlsx'
import { isEmpty } from 'lodash'
import Validator from './validator'

// import logger from './logger'
// import { GatewayError } from '../util'
 
/**
 *  interface Column {
 *  title: string // 表头文案
 *  key: string // 字段
 *  backfill?: (val) => ({}) // 回填至dto的对象 .e.g 当用户上传cityId, 服务接收dto内需要cityId, cityName
 *  rules?: <Rule>[] // 校验，async-validator有的一切
 *  render?: function
 * }
 *
 * interface Rule // 是你熟悉的async-validator
 *
 * schema是描述 上传 & 导出的excel概要
 * - 上传可能会用到的schema属性: title rules key backfill
 * - 导出可能会用到的schema属性: title key render
 * @export
 * @class XlsxHero
 */
// TODO: custom eror wrapper and logger
export default class XlsxHero {
  private allowEmpty: boolean
  private needBackFill: boolean
  private errs: any
  private rowAppend: any
  private first: boolean
  private maxlength: any
  private name: any
  private descriptor: any
  private columns: any
  private keys: any
  private header: any
  private validator: Validator

  /**
   * Creates an instance of XlsxHero.
   * @param {*} {
   *      name?: string,
   *      maxlength?: number,excel最大数据行数，抛开表头
   *      first?: boolean,是否校遇到第一个校验失败就抛出，默认false（当你想要全部的错误信息的时候可能会用到）
   *      rowAppend: 需要添加到每一个dto内的键值对
   *      columns: Column[],
   *   }
   * @memberof XlsxHero
   */
  constructor({
    name,
    maxlength,
    first,
    rowAppend,
    columns,
    allowEmpty = true,
  }: XlsxHeroProps) {
    if (!(columns instanceof Array)) {
      throw TypeError('xlsx hero 的 columns 必须是一个数组')
    }

    this.allowEmpty = allowEmpty
    this.needBackFill = false// 需要回填
    this.errs = []// 校验错误收集
    this.rowAppend = rowAppend// 需要添加到每一个dto内的键值对
    this.first = first
    this.maxlength = maxlength
    this.name = name
    this.descriptor = {}
    this.columns = columns || []
    this.keys = columns.map(s => s.key)
    this.header = columns.map(s => s.title)
    this.validator = new Validator(columns)
    // this.buildDescriptor()
  }

  // TODO: remove later
  // /**
  //  * 生成async-validator所需的descriptor
  //  */
  // buildDescriptor(): void {
  //   const columns = this.columns
  //   for (let i = 0; i < columns.length; i++) {
  //     const column = columns[i]
  //     const { key, rules } = column

  //     if (rules) {
  //       this.descriptor[key] = rules
  //     }
  //   }
  // }

  /**
   * 生成buffer或sheet数组
   *
   * @param {*} [data=[]]
   * @param {boolean} [raw=false]
   * @returns {(XlsxCell[][] | any[])}
   * @memberof XlsxHero
   */
  public generateSheet(data = [], raw = false): XlsxCell[][] | any[] {
    const sheet = [this.header]
    for (let i = 0; i < data.length; i++) {
      const el = data[i]
      const row = []

      for (let x = 0; x < this.columns.length; x++) {
        const cellConf = this.columns[x]
        const { key, render } = cellConf
        const cell = el[key]
        row.push(
          render ? render(cell, el) : cell
        )
      }

      sheet.push(row)
    }

    return raw
      ? sheet
      : xlsx.build([{ name: this.name, data: sheet }])
  }

  /**
   * 一般做构建导入模板用
   *
   * @returns
   * @memberof XlsxHero
   */
  buildTemplate(name = 'untitled') {
    const data = xlsx.build([{ name, data: [this.header] }])
    return { fileName: `${name}.xlsx`, data }
  }

  /**
   * 校验数据，data可能是用户上传的一份excel file
   *
   * @param {*} data
   * @memberof XlsxHero
   */
  private async validate(file: any) {
    if (!file) { throw new Error('未发现文件，请检查是否文件类型是否正确') }

    const start = new Date()
    const sheet = xlsx.parse(file.buffer, { raw: false })[0]
    const datas = sheet.data
    datas.shift()// 剔除表头

    const datasCount = datas.length
    const max = this.maxlength

    if (datasCount < 1) { throw new Error('导入失败，上传的似乎是个空表格') }
    if (max && datasCount > max) { throw new Error(`导入失败，上传表格行数最多为${max}条`) }

    // const validator = new av(this.descriptor)
    const cleanData: XlsxCell[] = []
    for (let i = 0; i < datasCount; i++) {
      const rowStart = new Date()
      const row = this.makeRow(datas[i], i)

      // 按 每1行 进行校验
      // 空的行将在不会进行校验 && 不会被push至cleanData
      if (!isEmpty(row)) {
        await this.validateRow(row, i, datasCount)
        .then(async () => {
          cleanData.push(
            await this.backfill(row)
          )
        })
        .catch((err) => {
          this.handleErrors(err, i)// 收集错误，如果first===true，将会直接抛出
        })
        // logger.info(`xlsx hero validate row ${i}, total length ${datasCount}, cost ${new Date() - rowStart}`)
      }
    }

    if (!isEmpty(this.errs)) {
      throw new Error(this.errs)
    }

    // logger.info(`xlsx hero get all validated total length ${datasCount}, cost ${new Date() - start}`)

    return cleanData
  }

  /**
   * 校验每一行，promise包装validator.validator
   *
   * @param {*} data
   * @memberof XlsxHero
   */
  validateRow = (row: XlsxCell[], i: number, datasCount: number) => new Promise((resolve, reject) => {
    this.validator.validate(row, { first: this.first }, (err: Error, fields: any) => {
      if (!err) {
        resolve()
      } else {
        reject(err)
      }
    })
  })

  /**
   * 格式化excel一行 - 以进行校验
   *
   * @param {*} content 一行数据
   * @param {*} index 这行index
   * @returns
   * @memberof XlsxHero
   */
  makeRow<T>(content: XlsxCell[] | any[], index: number): T | any {
    if (isEmpty(content) && this.allowEmpty) {
      return {}
    }
    if (isEmpty(content) && !this.allowEmpty) {
      throw new Error(`第${index + 2}行为空`)
    }
    const columns = this.columns
    const row: any = {}
    row.backfillList = []

    for (let i = 0; i < content.length; i++) {
      const cell = content[i]
      const field = columns[i]

      if (!field) {
        return {}
      }

      // if (!cell) {
        // throw new GatewayError(`第${index + 2}行格式异常，请依照模板进行填写`)
      // }

      const { key, backfill } = field

      // 存在需要回填函数包装的key，标记校验完成后进行回填
      // 这里暂存所有需要backfill的字段，以免将会发生的校验失败，调用backfill时内会有错误
      // backfill函数应在确保校验通过后进行调用
      // if (!this.needBackFill && backfill) { this.needBackFill = true }
      Object.assign(row, { [key]: cell })

      if (backfill) {
        row.backfillList.push(
          () => backfill(cell)
        )
      }
    }

    return row
  }

  /**
   * 回填需要包装的key
   */
  async backfill <T>(row: any): Promise<T> {
    const { backfillList } = row

    for (let i = 0; i < backfillList.length; i++) {
      const bf = backfillList[i]
      Object.assign(row, await bf())
    }

    // 需要添加到每一个dto内的键值对
    if (this.rowAppend) {
      Object.assign(row, this.rowAppend)
    }

    delete row.backfillList
    return row
  }

  /**
   *
   *
   * @param {*} err 错误
   * @param {*} i 行数
   * @memberof XlsxHero
   */
  private handleErrors(err: Error, i: number) {
    if (this.first) { // 第一个校验失败就抛出
      throw new Error(
        JSON.stringify([this.wrapError(err, i)])
      )
    }
    this.errs.push(
      this.wrapError(err, i)
    )
  }

  wrapError = (err: Error, i: number) => ({
    row: i,
    content: err
  })
}
