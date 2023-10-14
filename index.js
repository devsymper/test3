import fs from "fs";
import { parse } from 'node-html-parser';
import fetch from "node-fetch";
import { getAllDetail } from "./getFullInfo.js";


var nodeIndex = Number(fs.readFileSync('./nodeNum.txt'));
var totalPage = 32398;
var nodeNum = 10;

function getDataAndSave(content) {
    let page =  parse(content);
    let items = page.querySelectorAll('.search-results')
    let rsl ;

    for (const item of items) {
        let text = item.querySelector('p').innerText.replaceAll('\n', ' ');
        text = text.split(/Mã số thuế: |- Đại diện pháp luật: |Địa chỉ: /ig)
        rsl = {
            time: Date.now(),
            url: item.querySelector('a').getAttribute('href'),
            ten_cong_ty: item.querySelector('a').innerText.trim(),
            ma_so_thue: text[1].trim(),
            nguoi_dai_dien: text[2].trim(),
            dia_chi: text[3].trim(),

            dien_thoai: '',
            loai_hinh_dn: '',
            ngay_hoat_dong: '',
            quan_ly_boi: '',
            tinh_trang: '',            
        }
        fs.appendFileSync("data.csv", JSON.stringify(rsl)+'\n')
    }
}

async function run() {
    let pagePerNode = Math.floor(totalPage / nodeNum)
    let start = Number(fs.readFileSync("count.txt")) + 1
    if (start == 1 && nodeIndex != 1) {
        start = pagePerNode * nodeIndex
    }
    let end = pagePerNode * (nodeIndex + 1)

    for (let index = start; index < end; index++) {
        let link = `https://www.tratencongty.com/?page=${index}`
        let res = await fetch(link)
        let text = await res.text()
        getDataAndSave(text)
        fs.appendFileSync("visitedLinks.txt",link+'\n')
        fs.writeFileSync("count.txt", String(index))
    }
    await getAllDetail()
}

run()