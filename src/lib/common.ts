export namespace Constants {
    export const SPEC_URL        = 'https://w3c.github.io/epub-specs/epub33/core/' ;
    export const FEATURE_DIR_URL = 'https://github.com/w3c/epubcheck/tree/main/src/test/resources/epub3' ;
    export const TEST_REPORT_URL = 'https://w3c.github.io/epub-structural-tests/' ;

    /** Location for the resulting spec */
    export const SPEC_DIR: string = 'epub33/core'

    /** Location for the vocabulary specs */
    export const VOCAB_DIR: string = 'epub33/core/vocab'

    /** Location for the original spec */
    export const SPEC_DIR_ORIG = 'epub33-orig/core'
    
    /** Location for the original vocabulary specs */
    export const VOCAB_DIR_ORIG: string = 'epub33-orig/core/vocab'


    /** Location for the specification source */
    export const SPECS: string[] = [
        'epub33-orig/core/index.html',
        'epub33-orig/core/vocab/item-properties.html',
        'epub33-orig/core/vocab/itemref-properties.html',
        'epub33-orig/core/vocab/link.html',
        'epub33-orig/core/vocab/meta-property.html',
        'epub33-orig/core/vocab/rendering.html',
        'epub33-orig/core/vocab/overlays.html',
    ];

    /** Location online for the specification source */
    export const SPECS_ONLINE: string[] = [
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/index.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/item-properties.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/itemref-properties.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/link.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/meta-property.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/rendering.html',
        'https://raw.githubusercontent.com/w3c/epub-specs/main/epub33/core/vocab/overlays.html',
    ];

    /** Location for the HTML fragment on implementation lists */
    export const TABLE_FRAGMENTS: string = `docs/fragments/`;

    /** Location for the raw data for the tests */
    export const TEST_DATA: string = `epubcheck_data/tests.json`;

    /** CSS Class name for columns containing the ID-s */
    export const CLASS_COL_ID: string = "col_id";
}

/*--------------------------------------------------------------------------------------------
                         Data extracted from the epubcheck test suite
---------------------------------------------------------------------------------------------*/

/** Data corresponding to one single test */
export interface Test {
    /** `id` of the corresponding section in the spec */
    xref:       string[];

    /** 
     * The "feature" file that contains the test. If the
     * feature files are spread over several directories, it should be of the form
     * `dir/fname`.
     */
    file:  string;

    /** Line number, within the feature file, for the test. */
    line:   number;

    /** 
     * Short description of the scenario of the test. If necessary, this may be a simple
     * HTML fragment.
     */
    scenario: string;
};

/** This the data extracted from the overall test suite */
export type TestSuite = Test[];

/*--------------------------------------------------------------------------------------------
    Converted data, in a format that can be used the final report once converted into HTML
---------------------------------------------------------------------------------------------*/

export interface Section {
    /** Section title */
    title: string;

    /** Id value for the HTML element, to be used when the spec is manipulated */
    id: string;
    
    /** URL for that session in the spec */
    url:   string;
}

export interface TestReference {
    /** id value for the test, unique for all tests */
    id: string

    /** URL for that single test (pointing into the feature file) */
    url: string;

    /** URL for the table entry in the test description file */
    url_table_row: string;

    /** Test scenario, as extracted from the test */
    test_scenario: string;
}

export interface SectionTests {
    section: Section;
    tests: TestReference[];
}

export type TestDescription = SectionTests[];
