import { Constants, TestSuite, TestDescription }          from './lib/common';
import { convert_input, create_test_tables, modify_spec } from './lib/convert';
import { JSDOM }                                          from "jsdom";

import * as fs_old_school from "fs";
const fs = fs_old_school.promises;

/**
 * Master of ceremonies...
 * 
 * 1. read the test data, as extracted from the epubcheck tests
 * 2. convert the test data to a more suitable internal representation (essentially, group the tests by sections)
 * 3. create a document fragment, to be imported by a respec shell, to display the tests in a table, with suitable links
 * 4. modify the specification tests by adding the test references following what respec requires
 */
async function main(): Promise<void> {
    const inp_data = await fs.readFile(Constants.TEST_DATA, 'utf-8');
    const data: TestSuite = JSON.parse(inp_data) as TestSuite;

    const spec = Constants.SPEC;
    const src_txt: string = await fs.readFile(spec,'utf-8');
    const dom = new JSDOM(src_txt);
    if (dom === null) {
        throw (`${spec} could not be parsed`);
    }

    const sections: TestDescription = convert_input(dom, data);
    const html_fragment: string = create_test_tables(sections);

    const modified_spec: string = await modify_spec(dom, Constants.SPEC,sections);

    await Promise.all([
        fs.writeFile(Constants.TABLE_FRAGMENT, html_fragment),
        fs.writeFile(Constants.SPEC_TMP, modified_spec)
    ]);
}

main();
