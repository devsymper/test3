import nReadlines from 'n-readlines';
import { parse } from 'node-html-parser';
import fetch from "node-fetch";
import tesseract from 'node-tesseract-ocr'
import fs from "fs";


const broadbandLines = new nReadlines('data.csv');

let line;

function getStartDate(data) {
    data = data.split('/')
    return data[2] + '-' + data[1] + '-' + data[0]
}

async function getTelephoneNumber(base64String) {
    return new Promise((resolve, reject) => {
        let base64Image = base64String.split(';base64,').pop();
        fs.writeFile('image.png', base64Image, {encoding: 'base64'}, function(err) {
            tesseract.recognize('image.png', {
                lang: "eng",
                oem: 1,
                psm: 3,
              }).then(text => {
                resolve(text.trim())
            }).catch(err => {
                reject(err);
            })
        });
    })
}

export async function getAllDetail() {
    let c2 = 'count2.txt'
    let startCount = Number(fs.readFileSync(c2))
    let cursor = 0

    while (line = broadbandLines.next()) {
        if (cursor < startCount) {
            cursor += 1;
            continue
        }
        let info = JSON.parse(line.toString('utf8'))
        let temp = await fetch(info.url)
        temp = await temp.text()
        temp = parse(temp)
        let jumbotron = temp.querySelector('.jumbotron')
        
        temp = jumbotron.innerText.replaceAll('\n', ' ');
        temp = temp.split(/Mã số thuế: |Địa chỉ: |Đại diện pháp luật: |Ngày cấp giấy phép: |Ngày hoạt động: |Điện thoại trụ sở: |Trạng thái: /ig)
        let img = jumbotron.querySelector('img')
        info.dien_thoai = img ? await getTelephoneNumber(img.getAttribute('src')) : ''

        info.tinh_trang = temp[7].trim()
        info.ngay_hoat_dong = getStartDate(temp[4].trim())
        info.time = Date.now()

        fs.appendFileSync("data2.csv", JSON.stringify(info)+'\n')
        
        cursor += 1;
        startCount += 1;

        fs.writeFileSync(c2, String(startCount))
    }    
}
