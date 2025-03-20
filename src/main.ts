import { Constants, TestSuite, TestDescription }          from './lib/common';
import { convert_input, create_test_tables, modify_spec } from './lib/convert';
import { JSDOM }                                          from "jsdom";
import fetch                                              from "node-fetch";
import { Command, OptionValues }                          from 'commander';


import * as fs_old_school from "fs";
const fs = fs_old_school.promises;

/**
 * Handle the tests for one specification
 * 
 * 1. create a document fragment, to be imported by a respec shell, to display the tests in a table, with suitable links
 * 2. modify the specification tests by adding the test references following what respec requires
 */

async function handleOneSpec(data: TestSuite, fname: string, options: OptionValues): Promise<void> {
    const fname_path: string[] = fname.split('/');
    if (fname_path.length != 0) {
        const base_name: string | undefined = fname_path.pop();
        const table_fragment_name: string = `${Constants.TABLE_FRAGMENTS}${base_name}`;
        const modified_fname =  base_name === 'index.html' ? `${Constants.SPEC_DIR}/index.html` :  `${Constants.VOCAB_DIR}/${base_name}`;
        const local_copy_fname = base_name === 'index.html' ? `${Constants.SPEC_DIR_ORIG}/index.html` :  `${Constants.VOCAB_DIR_ORIG}/${base_name}`;

        // Possible extra async actions to be performed at the end
        const extra_async_actions: unknown[] = [];

        // Get the spec text
        let src_text: string;
        if (options.local) {
            console.log(`picking up ${base_name} locally`)
            src_text = await fs.readFile(fname, 'utf-8');
        } else {
            console.log(`downloading ${base_name} from github`)
            const response = await fetch(fname);
            src_text = await response.text(); 
            if (options.download) {
                extra_async_actions.push(fs.writeFile(local_copy_fname, src_text))
            }
        }

        // Get the spec as a DOM
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
            ...extra_async_actions
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
    const program = new Command();
    program
        .name('harvest epubcheck tests')
        .description('Harvesting EPUB 3.4 specific test information to produce a test report for the EPUB 3.4 CR phase')
        .usage('[options]')
        .option('-l, --local', 'Pick up the specification files locally instead of fetching them from github')
        .option('-d, --download','When picking up the specification files from github, store them locally')
        .parse(process.argv);

    const options: OptionValues = program.opts();
    const sources: string[]     = options.local ? Constants.SPECS : Constants.SPECS_ONLINE ;

    const inp_data = await fs.readFile(Constants.TEST_DATA, 'utf-8');
    const data: TestSuite = JSON.parse(inp_data) as TestSuite;
    await Promise.all(sources.map((fname) => handleOneSpec(data, fname, options)));
}

main();
