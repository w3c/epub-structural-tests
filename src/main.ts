import { Constants, TestSuite, TestDescription }          from './lib/common';
import { convert_input, create_test_tables, modify_spec } from './lib/convert';
import { JSDOM }                                          from "jsdom";

import * as fs_old_school from "fs";
const fs = fs_old_school.promises;

/**
 * Handle the tests for one specification
 * 
 * 1. create a document fragment, to be imported by a respec shell, to display the tests in a table, with suitable links
 * 2. modify the specification tests by adding the test references following what respec requires
 */

async function handleOneSpec(fname: string, data: TestSuite): Promise<void> {
    const fname_path: string[] = fname.split('/');
    if (fname_path.length != 0) {
        const base_name: string | undefined = fname_path.pop();
        const table_fragment_name: string = `${Constants.TABLE_FRAGMENTS}${base_name}`;
        const modified_fname =  base_name === 'index.html' ? `${Constants.SPEC_DIR}/index.html` :  `${Constants.VOCAB_DIR}/${base_name}`;

        // Get the spec as a DOM
        const src_text: string = await fs.readFile(fname, 'utf-8');
        const dom = new JSDOM(src_text);
        if (dom === null) {
            console.error(`${fname} could not be parsed`);
            return;
        }

        // Convert the relevant input data to the format used in subsequent steps
        const sections: TestDescription = convert_input(dom, data);

        // Create the HTML fragment for the test tables (as a serialized HTML fragment; 
        // this will be an input to the final report)
        const html_fragment: string = create_test_tables(sections);

        // Create the modified version of the spec (as a serialized HTML fragment)
        const modified_spec: string = modify_spec(dom, sections)

        await Promise.all([
            fs.writeFile(table_fragment_name, html_fragment),
            fs.writeFile(modified_fname, modified_spec),
        ]);
    }
} 

/**
 * Master of ceremonies...
 * 
 * 1. read the test data, as extracted from the epubcheck tests
 * 2. for each document to be modified and checked run `handleOneSpec` 
 */
async function main(): Promise<void> {
    const inp_data = await fs.readFile(Constants.TEST_DATA, 'utf-8');
    const data: TestSuite = JSON.parse(inp_data) as TestSuite;
    await Promise.all(Constants.SPECS.map( (fname) => handleOneSpec(fname, data)));
}

main();
