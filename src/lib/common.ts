export namespace Constants {
    export const SPEC_URL        = 'https://w3c.github.io/epub-specs/epub33/core/' ;
    export const FEATURE_DIR_URL = 'https://github.com/w3c/epubcheck/src/test/resources/epub3' ;
    export const TEST_REPORT_URL = 'https://w3c.github.io/epub-specs/epub33/reports/epubcheck.html' ;

    /** Location for the final report */
    export const DOCS_DIR: string = 'reports';

    /** Location for the specification source */
    export const SPECS: string[] = [
        'epub33/core/index.html',
        'epub33/core/vocab/item-properties.html',
        'epub33/core/vocab/itemref-properties.html',
        'epub33/core/vocab/link.html',
        'epub33/core/vocab/meta-property.html',
        'epub33/core/vocab/rendering.html',
        'epub33/core/vocab/overlays.html',
    ];

    /** Location for the HTML fragment on implementation lists */
    export const TABLE_FRAGMENTS: string = `${DOCS_DIR}/fragments/`;

    /** Location for the raw data for the tests */
    export const TEST_DATA: string = `${DOCS_DIR}/tests.json`;

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
