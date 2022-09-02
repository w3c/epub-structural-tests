import { Constants, TestSuite, Test, TestDescription } from './common';
import { JSDOM }                                       from "jsdom";

import * as fs_old_school from "fs";
const fs = fs_old_school.promises;

/**
 * Add a new HTML Element to a parent, and return the new element
 * 
 * @param parent The parent HTML Element
 * @param element The new element's name
 * @param content The new element's (HTML) content
 * @returns the new element
 * 
 * @internal
 */
 export function add_child(parent: HTMLElement, element: string, content: string|undefined = undefined): HTMLElement {
    const new_element = parent.ownerDocument.createElement(element);
    parent.appendChild(new_element);
    if (content !== undefined) new_element.innerHTML = content;
    return new_element;
}

/**
 * Convert the information as described in the input JSON file into a format more easily usable
 * to generate HTML tables for the tests, one for each specification sections.
 *  
 * @param inp information on the tests as described in the input JSON file
 * @returns consolidated tests, grouped by section information
 */
export function convert_input(inp: TestSuite): TestDescription {
    // This will become the output
    const outp: TestDescription = [];

    // The data set may not be in section order, e.g., if a feature file contains
    // tests for different sections. Ordering them here. Incidentally, the
    // full array is ordered in section text (ie, section number) order.
    inp = inp.sort( (a: Test, b: Test): number => {
        if (a.section < b.section) return -1;
        else if (a.section > b.section) return 1;
        else return 0;
    });

    // This will act as a "switch" to start a new SectionTest structure.
    let current_section_name = ''
    for (const test of inp) {
        // See if a new SectionTest structure should be added:
        if (current_section_name !== test.section) {
            // The extra conversions is to pacify Typescript, which otherwise
            // complains that, e.g., test.id may be undefined. We know it is
            // not the case due to normalization above, but that goes
            // beyond what TS can handle...
            outp.push({
                section: {
                    id: test.id,
                    title: test.section,
                    title_no_number : test.section.split(' ').slice(1).join(' '),
                    url: `${Constants.SPEC_URL}#${test.id}`
                },
                tests: []
            })
            current_section_name = `${test.section}`;
        }
        const id = `${test.file}_L${test.line}`;
        outp[outp.length-1].tests.push({
            id,
            url: `${Constants.FEATURE_DIR_URL}/${test.file}#L${test.line}`,
            url_table_row : `${Constants.TEST_REPORT_URL}#${id}`,
            test_scenario: test.scenario,
        });
    }
    return outp;
} 


/**
 * Create the HTML fragment for the test tables. Each section is in its own (HTML) section and 
 * the corresponding tests are in a table.
 * 
 * The function returns an HTML fragment serialized in a string (to be included via respec into the final report)
 * 
 * @param data consolidated data on all the tests
 * @returns HTML fragment serialized as string
 */
 export function create_test_tables(data: TestDescription): string {
    const dom: DocumentFragment = JSDOM.fragment('<section id="sec-test-tables"><h2>Description of the Tests</h2></section>');
    const full_section = dom.querySelector('section');

    // This should not happen, but we have to keep the TS compiler happy...
    if (full_section === null) return '';

    for (const table of data) {
        // This is one section...
        const table_section = add_child(full_section, 'section');
        const h3 = add_child(table_section, 'h3', ` Tests for <a href="${table.section.url}">§${table.section.title}</a>`);
        h3.id = table.section.id;

        const test_table = add_child(table_section, 'table');
        test_table.className = 'zebra';

        // Add a colgroup here like for the other html generator
        add_child(test_table, 'colgroup',`
            <col class="${Constants.CLASS_COL_ID}"/>
        `);

        // Header row:
        add_child(test_table, 'tr',`
            <th>ID</th>
            <th>Description</th>
        `);

        for (const row of table.tests) {
            const tr = add_child(test_table,'tr');
            tr.setAttribute('id', row.id)

            // a bunch of table cells
            const td_id = add_child(tr, 'td');
            const a_id = add_child(td_id, 'a', row.id);
            a_id.setAttribute('href', row.url);

            add_child(tr, 'td', row.test_scenario);
        }
    }

    // This is where the object is turned into an XML serialization
    return full_section.outerHTML;
}


/**
 * Modify the specification: for each section that appears in the text:
 * 
 * * add a `data-epubcheck=true` attribute
 * * add a `data-tests` attribute (defined by respec) with the absolute URL-s of the tests
 * 
 * @param spec reference to the specification file
 * @param section_tests list of test descriptions, by sections
 * @returns the modified (HTML) text of the specification
 */
export async function modify_spec(spec: string, section_tests: TestDescription): Promise<string> {
    const src_txt: string = await fs.readFile(spec,'utf-8');
    const dom = new JSDOM(src_txt);
    if (dom === null) {
        throw (`${spec} could not be parsed`);
    }
    const document = dom.window.document;

    for (const section_data of section_tests) {
        const section = document.querySelector(`section#${section_data.section.id}`);
        if (section === null) {
            console.log(`Could not find section element with id "${section_data.section.id}"`);
        } else {
            section.setAttribute('data-epubcheck', "true");
            const urls = section_data.tests.map((test) => test.url_table_row);
            section.setAttribute('data-tests', `${urls}`);
        }
    }

    return dom.serialize();
}

