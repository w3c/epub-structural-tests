import { Constants, TestSuite, Test, TestReference, TestDescription, Section, SectionTests } from './common';
import { JSDOM }                                                                             from "jsdom";

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
function add_child(parent: HTMLElement, element: string, content: string|undefined = undefined): HTMLElement {
    const new_element = parent.ownerDocument.createElement(element);
    parent.appendChild(new_element);
    if (content !== undefined) new_element.innerHTML = content;
    return new_element;
}


/**
 * Convert the information as described in the input JSON file into a format more easily usable
 * to generate HTML tables for the tests, one for each specification sections.
 *  
 * @param dom the DOM of the specification file, used to extract the section headers
 * @param inp information on the tests as described in the input JSON file
 * @returns consolidated tests, grouped by section information
 */
export function convert_input(dom: JSDOM, inp: TestSuite): TestDescription {
    const document = dom.window.document;
    interface IdSectionMapping {
        [index: string]: SectionTests
    }
    const idSectionMapping: IdSectionMapping = {};

    // Get the list of all id-s in the document to help sorting at the end
    const ids: string[] = []
    {
        const list = document.getElementsByTagName('section');
        for (let i = 0; i < list.length; i++) {
            const section = list.item(i);
            const id = section?.id || null;
            if (id) ids.push(id);
        }    
    }

    // Find the section title based on the ID; the assumption is that
    // the content of the first header element is the section header
    const section_title = (id: string): string|null => {
        const section = document.getElementById(id);
        if (section) {
            const header = section.querySelector('h1, h2, h3, h4, h5, h6');
            return header?.innerHTML || null;
        } else {
            // invalid id?
            return null
        }
    }

    // Create a full section structure using the id value
    const create_Section = (id: string): Section|null => {
        const title = section_title(id);
        if (title) {
            return {
                title: title,
                id: id,
                url: `${Constants.SPEC_URL}#${id}`
            }
        } else {
            return null
        }
    }

    // Create an Internal Test structure using the incoming data
    const create_TestReference = (test: Test): TestReference => {
        const id = `${test.file}_L${test.line}`;
        return {
            id,
            url: `${Constants.FEATURE_DIR_URL}/${test.file}#L${test.line}`,
            url_table_row : `${Constants.TEST_REPORT_URL}#${id}`,
            test_scenario: test.scenario,
        }

    }

    // Main loop: creating an object, keyed with the section id, and containing
    // the tests descriptions and the section data 
    for (const test of inp) {
        const test_reference = create_TestReference(test);
        // Loop through the ID values
        for (const id of test.xref) {
            // Check if the id is already collected in the section mapping;
            // if not, add it
            if (!(id in idSectionMapping)) {
                const section = create_Section(id);
                if (section !== null) {
                    idSectionMapping[id] = {
                        section,
                        tests: [test_reference]
                    }
                }
            } else {
                // the section has already been identified, just push
                // the new test to the list
                idSectionMapping[id].tests.push(test_reference)
            }
        }
    }

    // Before creating the output, the keys must be reordered into document order...
    const keys = Object.keys(idSectionMapping);
    keys.sort( (id1: string, id2: string) :number => {
        const id1_ = ids.indexOf(id1);
        const id2_ = ids.indexOf(id2);
        if ( id1_ < id2_ ) return -1;
        else if (id1_ > id2_) return 1;
        else return 0;
    });

    // Removing the key and producing just the section-tests pairs that is required for the output
    // Due to the previous ordering step, the values are in the right order.
    return keys.map( (id: string): SectionTests => idSectionMapping[id] );    
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
        const h3 = add_child(table_section, 'h3', ` Tests for the section “<a href="${table.section.url}">${table.section.title}</a>”`);
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
 * @param dom the DOM of the specification file, used to extract the section headers
 * @param spec reference to the specification file
 * @param section_tests list of test descriptions, by sections
 * @returns the modified (HTML) text of the specification
 */
export function modify_spec(dom: JSDOM, spec: string, section_tests: TestDescription): string {
    const document = dom.window.document;
    for (const section_data of section_tests) {
        const section = document.querySelector(`section#${section_data.section.id}`);
        if (section === null) {
            console.log(`Could not find section element with id "${section_data.section.id}"`);
        } else {
            section.setAttribute('data-epubcheck', "true");

            // We have to check whether previous runs have already added test references. If so, entries should be added.
            const urls = section_data.tests.map((test) => test.url_table_row);
            const current_test_references = section.getAttribute('data-tests');
            if (current_test_references === null ) {
                section.setAttribute('data-tests', `${urls}`);
            } else {
                // Using sets makes it sure that no repeated references are added
                //console.log(`Got here with ${section_data.section.id}`)
                const current_tests = new Set(current_test_references.split(','));
                for (let ref of urls) {
                    current_tests.add(ref);
                }
                section.setAttribute('data-tests', `${[...current_tests]}`);
            }
        }
    }

    return dom.serialize();
}

