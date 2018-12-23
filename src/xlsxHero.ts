import { isEmpty } from "lodash"
import xlsx from "node-xlsx"
import { Err } from "./errors"
import Validator from "./validator"

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
  private columns: any
  // private keys: any
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
    needBackFill,
    columns,
    allowEmpty = true,
  }: XlsxHeroProps) {
    if (!(columns instanceof Array)) {
      throw TypeError("xlsx hero 的 columns 必须是一个数组")
    }

    this.allowEmpty = allowEmpty
    this.needBackFill = needBackFill || false// 需要回填
    this.errs = []// 校验错误收集
    this.rowAppend = rowAppend// 需要添加到每一个dto内的键值对
    this.first = first
    this.maxlength = maxlength
    this.name = name
    this.columns = columns || []
    // this.keys = columns.map(s => s.key)
    this.header = columns.map((s) => s.title)
    this.validator = new Validator(columns, first)
  }

  /**
   * 生成buffer或sheet数组
   *
   * @param {*} [data=[]]
   * @param {*} [opts={}]
   * @returns {(XlsxRow[] | any[])}
   * @memberof XlsxHero
   */
  public generateSheet(data = [], opts: GenerateOpt = {}): XlsxRow[] | any[] {
    const { raw = false } = opts
    const sheet = [this.header]
    for (const el of data) {
      const row = []

      let x = 0
      do {
        const cellConf = this.columns[x]
        const { key, render } = cellConf
        const cell = el[key]
        row.push(
          render ? render(cell, el) : cell,
        )
        ++x
      } while (x < this.columns.length)

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
  public buildTemplate(name = "untitled") {
    const data = xlsx.build([{ name, data: [this.header] }])
    return { fileName: `${name}.xlsx`, data }
  }

  /**
   * 校验数据，data可能是用户上传的一份excel file
   *
   * @param {*} data
   * @memberof XlsxHero
   */
  public async validate<T>(file: any): Promise<ValidateResult> {
    if (!file) { throw Err("未发现文件，请检查是否文件类型是否正确") }

    const parseStart = new Date()
    const sheet = xlsx.parse(file.buffer, { raw: false })[0]
    const datas = sheet.data
    datas.shift()// 剔除表头
    const parseEnd = new Date()

    const datasCount = datas.length
    const max = this.maxlength

    if (datasCount < 1) { throw Err("导入失败，上传的似乎是个空表格") }
    if (max && datasCount > max) { throw Err(`导入失败，上传表格行数最多为${max}条`) }

    const validatedData: XlsxRow[] = []
    const validateStart = new Date()
    for (let i = 0; i < datasCount; i++) {
      const validateRowStart = new Date()
      const dirtyRow = this.makeRow(datas[i], i)

      // 按 每1行 进行校验
      // 空的行将在不会进行校验 && 不会被push至validatedData
      if (!isEmpty(dirtyRow)) {
        await this.validator.validateRow(dirtyRow, i, datasCount)
          .then(async () => {
            validatedData.push(
              await this.backfill(dirtyRow),
            )
          })
          .catch((err) => {
            this.handleErrors(err, i)// 收集错误，如果first===true，将会直接抛出
          })
        // logger.info(`xlsx hero validate row ${i}, total length ${datasCount}, cost ${new Date() - validateStart}`)
      }
    }

    if (!isEmpty(this.errs)) {
      throw Err(JSON.stringify(this.errs))
    }

    // logger.info(`xlsx hero get all validated total length ${datasCount}, cost ${new Date() - start}`)

    return { data: validatedData, detail: {
      parseCost: parseEnd.getTime() - parseStart.getTime(),
      validateCost: new Date().getTime() - validateStart.getTime(),
    }}
  }

  /**
   * 格式化excel一行 - 以进行校验
   *
   * @param {*} content 一行数据
   * @param {*} index 这行index
   * @returns
   * @memberof XlsxHero
   */
  public makeRow<T>(content: XlsxRow[] | any[], index: number): T | any {
    if (isEmpty(content) && this.allowEmpty) {
      return {}
    }
    if (isEmpty(content) && !this.allowEmpty) {
      throw Err(`第${index + 2}行为空`)
    }
    const columns = this.columns
    const row: any = {}
    row.backfillList = []

    for (let i = 0; i < content.length; i++) {
      const cell = content[i]
      const field = columns[i]

      if (!field) {
        continue
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

      // 在schema中指定需要backfill才会调用每一个单元格的backfill方法
      if (this.needBackFill && backfill) {
        row.backfillList.push(
          () => backfill(cell),
        )
      }
    }

    return row
  }

  /**
   * 回填需要包装的key
   */
  private async backfill(row: XlsxRow): Promise<XlsxRow> {
    const { backfillList } = row

    for (const bf of backfillList) {
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
      throw Err(
        JSON.stringify([this.wrapError(err, i)]),
      )
    }
    this.errs.push(
      this.wrapError(err, i),
    )
  }

  private wrapError = (err: Error, i: number) => ({
    content: err,
    row: i,
  })
}
