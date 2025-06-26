// @ts-types="npm:@types/react@19.0.8"
import React from 'react'
import { createRoot } from "react-dom/client"
const { pdfjsLib, XLSX } = globalThis as unknown as {
    pdfjsLib: typeof import('npm:pdfjs-dist'),
    XLSX: typeof import('npm:xlsx')
}
const csrfToken = (top as unknown as { csrfToken: string }).csrfToken
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js'

createRoot(document.getElementById("output")!).render(<App />)
const loading = document.getElementById("loading") as HTMLDialogElement
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            resolve(reader.result as ArrayBuffer)
        }
        reader.onerror = () => {
            reject(reader.error)
        }
        reader.readAsArrayBuffer(file)
    })
}
function dateFormator(date: Date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0')
}
type Record = { suministro: string, dia: string, fecha: string, desde: string, hasta: string, file: string, company: string, file_name: string, record_items?: RecordItem[] }
type RecordItem = { site_id: string, suministro: string, fm_office: string }
type TaskItem = { record_id: string, site_id: string, suministro: string, dia: string, fecha: string, desde: string, hasta: string, file: string, company: string, file_name: string }
function getEntrie(records: Record[]) {
    const map = new Map<string, [TaskItem]>()
    records.forEach((record) => {
        record.record_items?.forEach(item => {
            const taskItem = {
                record_id: '',
                site_id: item.site_id,
                suministro: record.suministro,
                dia: record.dia,
                fecha: record.fecha,
                desde: record.desde,
                hasta: record.hasta,
                file: record.file,
                company: record.company,
                file_name: record.file_name
            }
            const key = item.fm_office
            const arr = map.get(key)
            if (arr) {
                arr.push(taskItem)
            } else {
                map.set(key, [taskItem])
            }
        })
    })
    return {
        tasks: Array.from(map.entries()),
        noSiteRecords: records.filter(record => !record.record_items)
    }
}
const module = "scheduled_energy_cut_clone/scheduled_energy_cut"
const reg = /(\d{2}\/\d{2}\/\d{4}) desde las (\d{2}:\d{2}) h hasta (?:.+ (\d{2}\/\d{2}\/\d{4}) a )?las (\d{2}:\d{2})/gm
const reg_s = /Suministro: (\d+)/m
function App() {
    const [data, setData] = React.useState<{ records: Record[], errors: string[] }>({ records: [], errors: [] })
    const inputRef = React.useRef<HTMLInputElement>(null)
    const entrie = getEntrie(data.records)
    return <>
        <h1>Step1: Upload File</h1>
        {/* file input */}
        <input ref={inputRef} type="file" multiple accept=".xlsx,.pdf" autoComplete="off" onChange={async (event) => {
            const files = (event.target as HTMLInputElement)?.files
            if (!files) return
            const fileList = Array.from(files)
            if (data.records.some(item => fileList.some(file => file.name === item.file_name))) {
                const r = confirm('Some File have been uploaded, continue?')
                if (r === false) {
                    return
                }
            }
            // check file cloud exist
            const check_res = await fetch(`/adc-service/web/rest/v1/services/${module}/sec_file_duplicate_check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-gde-csrf-token": (top as unknown as { csrfToken: string }).csrfToken
                },
                body: JSON.stringify({ file_name: fileList.map(file => file.name) })
            })
            const check_json = await check_res.json() as { results: [] }
            if (check_json.results.length) {
                const r = confirm('Some file have been submited before, continue?')
                if (r === false) {
                    return
                }
            }
            loading.showModal()
            const list: Record[] = []
            const errors = data.errors
            start_position: for (let i = 0, len = fileList.length; i < len; i++) {
                const file = files[i]
                // get token
                const token_res = await fetch("/adc-file/web/rest/v1/file/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-gde-csrf-token": csrfToken
                    },
                    body: JSON.stringify({ "file_check_rule": { "max_file_count": 5, "max_file_size": 524288000 } })
                })
                const token_json = await token_res.json() as { result: string }
                const token = token_json.result
                // upload file
                const formData = new FormData()
                formData.append('file', file)
                await fetch("/adc-file/web/rest/v1/file/upload", {
                    method: "POST",
                    headers: {
                        "x-gde-csrf-token": csrfToken,
                        "mateinfo-file-token": token
                    },
                    body: formData
                })
                if (file.type === 'application/pdf') {
                    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file))
                    const pdf = await loadingTask.promise
                    const page = await pdf.getPage(1)
                    const { items } = await page.getTextContent()
                    const text = items.map((item) => {
                        if ('str' in item) {
                            return item.str
                        }
                    }).join('')
                    const suministro = reg_s.exec(text)?.[1]
                    if (!suministro) {
                        errors.push(file.name + ': PDF Parsing Error')
                        return
                    }
                    let match
                    while ((match = reg.exec(text)) !== null) {
                        if (match.index === reg.lastIndex) {
                            reg.lastIndex++
                            continue
                        }
                        let [, dia, desde, fecha, hasta] = match
                        if (dia && desde && hasta) {
                            dia = dia.split('/').reverse().join('-')
                            fecha = fecha ? fecha.split('/').reverse().join('-') : dia
                            desde = desde + ':00'
                            hasta = hasta + ':00'
                            list.push({
                                suministro,
                                dia,
                                fecha: fecha.split('/').reverse().join('-'),
                                desde,
                                hasta,
                                file: token,
                                company: 'LUZ DEL SUR',
                                file_name: file.name
                            })
                        }
                    }
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const data = await readFileAsArrayBuffer(file)
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
                    const sheet = workbook.Sheets[workbook.SheetNames[0]]
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })

                    for (let i = 1; i < json.length; i++) {
                        const row = json[i] as unknown[]
                        const suministro = row[0]?.toString()
                        const dia = row[21]
                        const fecha = row[22]
                        const desde = row[19]?.toString().match(/\d\d:\d\d:\d\d/)?.[0]
                        const hasta = row[20]?.toString().match(/\d\d:\d\d:\d\d/)?.[0]
                        if (
                            suministro
                            && dia instanceof Date
                            && fecha instanceof Date
                            && desde
                            && hasta
                        ) {
                            list.push({
                                suministro,
                                dia: dateFormator(dia),
                                fecha: dateFormator(fecha),
                                desde,
                                hasta,
                                file: token,
                                company: 'PLUZ',
                                file_name: file.name
                            })
                        } else {
                            errors.push(file.name + `: Line ${i} XLSX Parse error`)
                            continue start_position
                        }
                    }
                } else {
                    errors.push(file.name + ": Unsupported file type")
                    continue start_position
                }
            }
            if (list.length) {
                const site_res = await fetch(`/adc-service/web/rest/v1/services/${module}/sec_cmdb_site_get_list`, {
                    method: "POST",
                    headers: {
                        "x-gde-csrf-token": csrfToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ suministro: list.map(item => item.suministro) })
                })
                const site_json = await site_res.json() as {
                    results: RecordItem[]
                }
                const siteMap = new Map<string, RecordItem[]>()
                site_json.results.forEach(item => {
                    const arr = siteMap.get(item.suministro)
                    if (arr) {
                        arr.push(item)
                    } else {
                        siteMap.set(item.suministro, [item])
                    }
                })
                list.forEach(item => {
                    item.record_items = siteMap.get(item.suministro)
                })

            }
            setData({ records: data.records.concat(list), errors })
            inputRef.current!.value = ''
            loading.close()
        }} />
        <h1>Step2: Check Parse Result</h1>
        {/* table show records */}
        <table>
            <thead>
                <tr>
                    <th><div style={{ width: 200 }}>FM Office</div></th>
                    <th><div style={{ width: 150 }}>Company</div></th>
                    <th><div style={{ width: 100 }}>Suministro</div></th>
                    <th><div style={{ width: 100 }}>Día</div></th>
                    <th><div style={{ width: 100 }}>Fecha</div></th>
                    <th><div style={{ width: 100 }}>Desde</div></th>
                    <th><div style={{ width: 100 }}>Hasta</div></th>
                    <th><div style={{ width: 200 }}>File Name</div></th>
                    <th><div style={{ width: 200 }}>Affect Site</div></th>
                </tr>
            </thead>
            <tbody>
                {entrie.tasks.map(([key, arr], sort) => arr.map((item, index) => <tr key={index + '-' + sort}>
                    {index === 0 ? <td rowSpan={arr.length}>{key}</td> : null}
                    <td>{item.company}</td>
                    <td>{item.suministro}</td>
                    <td>{item.dia}</td>
                    <td>{item.fecha}</td>
                    <td>{item.desde}</td>
                    <td>{item.hasta}</td>
                    <td>{item.file_name}</td>
                    <td>{item.site_id}</td>
                </tr>)
                )}
                {entrie.noSiteRecords.map((item, index) => <tr key={index} style={{ textDecoration: 'line-through' }}>
                    <td></td>
                    <td>{item.company}</td>
                    <td>{item.suministro}</td>
                    <td>{item.dia}</td>
                    <td>{item.fecha}</td>
                    <td>{item.desde}</td>
                    <td>{item.hasta}</td>
                    <td>{item.file_name}</td>
                    <td></td>
                </tr>)}
            </tbody>
        </table>
        {/* error message */}
        <div>
            {data.errors.map((item, index) => <div key={index}>{item}</div>)}
        </div>
        <h1>Step 3: Submit</h1>
        {/* button submit table */}
        <button onClick={async () => {
            loading.showModal()
            const tasks = getEntrie(data.records).tasks
            const res = await fetch(`/adc-model/web/rest/v1/model-services/${module}/sec_record/batch_create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-gde-csrf-token": csrfToken
                },
                body: JSON.stringify({
                    _values: tasks.map(([key]) => {
                        return { fm_office: key }
                    }),
                })
            })
            if (!res.ok) {
                const json = await res.json()
                alert(json.error?.message)
                loading.close()
                return
            }
            const res_json = await res.json() as {
                results: { id: string }[]
            }
            tasks.forEach(([_key, arr], index) => {
                arr.forEach((item) => {
                    item.record_id = res_json.results[index].id
                })
            })
            await fetch(`/adc-model/web/rest/v1/model-services/${module}/sec_record_item/batch_create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-gde-csrf-token": csrfToken
                },
                body: JSON.stringify({
                    _values: tasks.flatMap(([_, arr]) => arr)
                })
            })
            alert('Success')
            setData({ records: [], errors: [] })
            inputRef.current!.value = ''
            loading.close()
        }} type="button">Submit</button>
        {/* guide image */}
        <div>
            <img src="./guide.jpg" alt="guide" width={600} />
        </div>
    </>
}