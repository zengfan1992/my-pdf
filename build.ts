import * as esbuild from "https://deno.land/x/esbuild@v0.24.2/mod.js"
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11.1"
if (Deno.args[0] === "dev") {
    const ctx = await esbuild.context({
        plugins: [...denoPlugins()],
        entryPoints: ["src/index.tsx"],
        bundle: true,
        outdir: "build/dist",
        minify: false,
        sourcemap: "inline",
        format: "esm",
    })
    // await ctx.watch()
    const { host, port } = await ctx.serve({ servedir: "build/dist", fallback: "build/dist/index.html" })
    Deno.serve({ port: 4242 }, async (req) => {
        const url = new URL(req.url)
        const path = url.pathname
        if (req.method === "GET") {
            return fetch(`http://${host}:${port}${path}`)
        }
        // mock /adc-file/web/rest/v1/file/token
        if (path === "/adc-file/web/rest/v1/file/token") {
            return new Response(JSON.stringify({ result: crypto.randomUUID() }))
        }
        // mock /adc-file/web/rest/v1/file/upload
        if (path === "/adc-file/web/rest/v1/file/upload") {
            return new Response()
        }
        // console req json body
        const body = await req.text()
        console.log(body)
        if (path.endsWith("sec_cmdb_site_get_list")) {
            return new Response(JSON.stringify({
                "results": [
                    {
                        "suministro": "1388966",
                        "site_id": "LI0043",
                        "fm_office": "HUAWEI LIMA ESTE"
                    },
                    {
                        "suministro": "1952627",
                        "site_id": "LIT4750",
                        "fm_office": "LIMA SUR CHICO CICSA PRONATEL"
                    }
                ],
                "total": -1
            }))
        }
        if (path.endsWith("sec_record/batch_create")) {
            return new Response(JSON.stringify({
                results: [{ id: 0 }, { id: 1 }]
            }))
        }
        if (path.endsWith("sec_file_duplicate_check")) {
            return new Response(JSON.stringify({
                "results": [{ 1: 1 }]
            }))
        }
        return new Response("{}")
    })
} else {
    await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: ["src/index.tsx"],
        bundle: true,
        outdir: "build/dist",
        minify: true,
        format: "esm",
        external: ["npm:pdfjs-dist", "npm:xlsx"],
    })
    esbuild.stop()
}
