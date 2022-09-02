import { JSDOM }  from "jsdom";
import { Constants } from './lib/common';
import * as fs_old_school from "fs";
const fs = fs_old_school.promises;



async function get_order() {
    const spec = Constants.SPEC;
    const src_txt: string = await fs.readFile(spec,'utf-8');
    const dom = new JSDOM(src_txt);
    if (dom === null) {
        throw (`${spec} could not be parsed`);
    }
    const document = dom.window.document;
    const list = document.getElementsByTagName('section');
    const ids: string[] = []
    for (let i = 0; i < list.length; i++) {
        const section = list.item(i);
        const id = section?.id;
        if (id) ids.push(id);
    }
    console.log(ids);

}

get_order();
