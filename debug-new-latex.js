// Debug script for testing the new LaTeX generation approach
// This script tests the renderGroundsToLatex function with various fake position statements

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to find pdflatex path
function findPdflatexPath() {
    const possiblePaths = [
        '/usr/local/texlive/2025/bin/universal-darwin/pdflatex',
        '/usr/local/texlive/2024/bin/universal-darwin/pdflatex',
        '/usr/local/texlive/2023/bin/universal-darwin/pdflatex',
        '/Library/TeX/texbin/pdflatex',
        '/usr/bin/pdflatex',
        '/usr/local/bin/pdflatex'
    ];
    
    for (const pdflatexPath of possiblePaths) {
        if (fs.existsSync(pdflatexPath)) {
            return pdflatexPath;
        }
    }
    
    // Fall back to system PATH
    try {
        const result = execSync('which pdflatex', { encoding: 'utf8', timeout: 5000 });
        return result.trim();
    } catch (error) {
        throw new Error('pdflatex not found. Please install LaTeX.');
    }
}

// Sanitize text by removing specific invisible characters that cause formatting issues
function sanitizeText(text) {
    if (!text) return '';
    
    // Log original text for debugging if it contains suspicious characters
    const suspiciousChars = /[\uFEFF\u200B\u200C\u200D\u2060\u202C\u202D\u202E\u00A0]/;
    if (suspiciousChars.test(text)) {
        console.log('🧹 Found suspicious characters in text, sanitizing...');
    }
    
    return text
        .normalize("NFC")
        // Remove specific problematic invisible characters
        .replace(/\uFEFF/g, '')      // ZERO WIDTH NO-BREAK SPACE (BOM)
        .replace(/\u200B/g, '')      // ZERO WIDTH SPACE
        .replace(/\u200C/g, '')      // ZERO WIDTH NON-JOINER
        .replace(/\u200D/g, '')      // ZERO WIDTH JOINER
        .replace(/\u2060/g, '')      // WORD JOINER
        .replace(/[\u202C\u202D\u202E]/g, '') // Bidirectional embedding/override characters
        .replace(/\u00A0/g, ' ')     // NO-BREAK SPACE -> normal space
        // Remove asterisks
        .replace(/\*/g, '')
        // Collapse multiple spaces/tabs
        .replace(/[ \t]+/g, ' ')
        // Reduce multiple blank lines but preserve Markdown paragraph breaks
        .replace(/\n{3,}/g, '\n\n')
        // Trim leading/trailing whitespace
        .trim();
}

// Escape special LaTeX characters
function escapeLatex(text) {
    if (!text) return '';
    
    // First sanitize the text to remove invisible characters
    const sanitized = sanitizeText(text);
    
    return sanitized
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\textasciitilde{}')
        // Convert all apostrophe types to simple straight apostrophe (but leave LaTeX quotes alone)
        .replace(/[''']/g, "'");
}

// Escape LaTeX characters and replace placeholders with actual values
function escapeLatexAndReplacePlaceholders(text, replacements) {
    if (!text) return '';
    
    // First sanitize the text to remove invisible characters
    let processedText = sanitizeText(text);
    
    // Then replace placeholders with actual values (also sanitize replacement values)
    for (const [placeholder, value] of Object.entries(replacements)) {
        const placeholderPattern = new RegExp(`\\[${placeholder}\\]`, 'g');
        const sanitizedValue = sanitizeText(String(value || ''));
        processedText = processedText.replace(placeholderPattern, sanitizedValue);
    }
    
    // Finally escape LaTeX characters (but don't sanitize again since escapeLatex now does it)
    return processedText
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\textasciitilde{}')
        // Convert all apostrophe types to simple straight apostrophe (but leave LaTeX quotes alone)
        .replace(/[''']/g, "'");
}

// Function to render grounds JSON to LaTeX
function renderGroundsToLatex(groundsJson, replacements, { startAt = 1, leftmargin = "6ex" } = {}) {
    if (!groundsJson || !Array.isArray(groundsJson.grounds)) {
        throw new Error("Invalid grounds JSON: expected an object with a 'grounds' array.");
    }

    let latex = "";
    const seriesName = "main";

    groundsJson.grounds.forEach((g, i) => {
        const groundNumber = i + 1;
        const title = escapeLatexAndReplacePlaceholders(g.title || "", replacements);
        latex += `\\section*{\\raggedright Ground ${groundNumber}: ${title}}\n`;

        const reasons = Array.isArray(g.reasons) ? g.reasons : [];

        if (reasons.length === 0) {
            // No enumerate block if no reasons
            latex += "\n";
            return;
        }

        if (i === 0) {
            // First list: series=main and optional start
            const startPart = startAt && startAt !== 1 ? `, start=${startAt}` : "";
            latex += `\\begin{enumerate}[label=\\arabic*.,${startPart}, leftmargin=${leftmargin}, series=${seriesName}]\n`;
        } else {
            // Subsequent lists: resume*=main
            latex += `\\begin{enumerate}[label=\\arabic*., leftmargin=${leftmargin}, resume*=${seriesName}]\n`;
        }

        for (const reason of reasons) {
            const item = escapeLatexAndReplacePlaceholders(reason || "", replacements);
            latex += `    \\item ${item}\n`;
        }

        latex += "\\end{enumerate}\n\n";
    });

    return latex.trim() + "\n";
}

// Fake position statements for testing
const testPositionStatements = [
    {
        name: "basic_test",
        data: {
            "grounds": [
                {
                    "title": "Inadequate Investigation",
                    "reasons": [
                        "The school failed to conduct a proper investigation before making the decision to exclude [childName].",
                        "No witnesses were interviewed and no evidence was gathered to support the allegations.",
                        "The decision was made hastily without following proper procedures."
                    ]
                },
                {
                    "title": "Failure to Consider Alternatives",
                    "reasons": [
                        "The school did not consider less severe sanctions before resorting to permanent exclusion.",
                        "No support plan was put in place to address [childName]'s behavioural needs."
                    ]
                }
            ]
        }
    },
    {
        name: "complex_test",
        data: {
            "grounds": [
                {
                    "title": "Breach of Natural Justice",
                    "reasons": [
                        "``A school must not discriminate against a pupil on the basis of disability.'' [Para 7, Exclusion Guidance]",
                        "The school failed to make reasonable adjustments for [childName]'s diagnosed ADHD.",
                        "No consideration was given to the impact of [childName]'s disability on their behaviour.",
                        "The exclusion decision was made without proper consideration of the Equality Act 2010."
                    ]
                },
                {
                    "title": "Procedural Failures",
                    "reasons": [
                        "The exclusion letter dated [exclusionDate] was not sent within the required timeframe.",
                        "[parentName] was not given adequate notice of the governors' meeting.",
                        "The school failed to provide all relevant evidence to [parentName] before the hearing."
                    ]
                },
                {
                    "title": "Inappropriate Sanction",
                    "reasons": [
                        "The alleged behaviour does not meet the threshold for permanent exclusion.",
                        "The school's own behaviour policy does not support such a severe sanction for this type of incident."
                    ]
                }
            ]
        }
    },
    {
        name: "special_characters_test",
        data: {
            "grounds": [
                {
                    "title": "Discrimination & Bias (Test Special Characters: $%#_^~)",
                    "reasons": [
                        "The school's decision was influenced by [childName]'s ethnic background—this is unacceptable.",
                        "Evidence shows a pattern of discrimination against students with disabilities (see attached documents).",
                        "The use of language such as ``problematic'' and ``disruptive'' shows bias against [childName]."
                    ]
                },
                {
                    "title": "Empty Ground Example",
                    "reasons": []
                }
            ]
        }
    }
];

async function testLatexGeneration() {
    console.log('🧪 Starting LaTeX generation tests...');
    
    for (const test of testPositionStatements) {
        console.log(`\n📝 Testing: ${test.name}`);
        
        try {
            // Sample data for testing
            const sampleData = {
                childName: 'Jane Smith',
                parentName: 'John Smith',
                schoolName: 'Test Academy',
                stage: 'Independent Review Panel',
                exclusionDate: '15/03/2025'
            };
            
            // Generate LaTeX for this test case
            const groundsLatex = renderGroundsToLatex(test.data, sampleData, { startAt: 4, leftmargin: "6ex" });
            console.log('📄 Generated LaTeX:', groundsLatex);
            
            // Generate ground titles list
            const groundTitlesList = test.data.grounds.map((ground, index) => {
                const groundNumber = index + 1;
                const title = escapeLatexAndReplacePlaceholders(ground.title || "", sampleData);
                return `\\item Ground ${groundNumber}: ${title}`;
            }).join('\n        ');
            
            // Read the LaTeX template
            const templatePath = path.join(__dirname, 'documents', 'position_statement_template.tex');
            let latexContent = await fs.readFile(templatePath, 'utf8');
            
            // Replace placeholders
            latexContent = latexContent
                .replace(/\\newcommand{\\childName}{[^}]*}/, `\\newcommand{\\childName}{${escapeLatex(sampleData.childName)}}`)
                .replace(/\\newcommand{\\parentName}{[^}]*}/, `\\newcommand{\\parentName}{${escapeLatex(sampleData.parentName)}}`)
                .replace(/\\newcommand{\\schoolName}{[^}]*}/, `\\newcommand{\\schoolName}{${escapeLatex(sampleData.schoolName)}}`)
                .replace(/\\newcommand{\\stage}{[^}]*}/, `\\newcommand{\\stage}{${escapeLatex(sampleData.stage)}}`)
                .replace(/\\newcommand{\\exclusionDate}{[^}]*}/, `\\newcommand{\\exclusionDate}{${escapeLatex(sampleData.exclusionDate)}}`);
                
            // Insert grounds
            latexContent = latexContent.replace('% INSERT GROUNDS HERE', groundsLatex);
            
            // Replace the groundsTitles placeholder
            latexContent = latexContent.replace('\\GroundsTitlesList{\\groundsTitles}', `\\GroundsTitlesList{\n        ${groundTitlesList}\n    }`);
            
            // Create temporary directory for compilation
            const tempDir = path.join(__dirname, 'temp', `debug_${test.name}_${Date.now()}`);
            await fs.ensureDir(tempDir);
            
            // Write the LaTeX file
            const texFile = path.join(tempDir, `debug_${test.name}.tex`);
            await fs.writeFile(texFile, latexContent);
            console.log('✍️ Written LaTeX file:', texFile);
            
            // Copy the logo file to temp directory
            const logoSrc = path.join(__dirname, 'images', 'vox_transparent.png');
            const imagesDir = path.join(tempDir, 'images');
            const logoDest = path.join(imagesDir, 'vox_transparent.png');
            if (await fs.pathExists(logoSrc)) {
                await fs.ensureDir(imagesDir);
                await fs.copy(logoSrc, logoDest);
            }
            
            // Compile LaTeX to PDF
            console.log('📄 Compiling LaTeX to PDF...');
            try {
                process.chdir(tempDir);
                
                const pdflatexPath = findPdflatexPath();
                console.log('📍 Using pdflatex at:', pdflatexPath);
                
                try {
                    const result = execSync(`"${pdflatexPath}" -interaction=nonstopmode debug_${test.name}.tex`, { 
                        encoding: 'utf8',
                        timeout: 30000
                    });
                    console.log('📄 LaTeX compilation completed normally');
                } catch (compileErr) {
                    console.warn('⚠️ LaTeX compilation returned exit code:', compileErr.status);
                    console.warn('⚠️ LaTeX compilation stderr:', compileErr.stderr);
                    console.log('🔍 Continuing to check for PDF output despite exit code...');
                }
                
                // Check if PDF was generated
                const pdfFile = path.join(tempDir, `debug_${test.name}.pdf`);
                if (await fs.pathExists(pdfFile)) {
                    console.log('✅ PDF generated successfully at:', pdfFile);
                    
                    // Copy PDF to main directory for easy access
                    const finalPdfPath = path.join(__dirname, `debug_${test.name}_output.pdf`);
                    await fs.copy(pdfFile, finalPdfPath);
                    console.log('📋 PDF copied to:', finalPdfPath);
                } else {
                    throw new Error('PDF compilation failed - no output file generated');
                }
                
            } catch (compileError) {
                console.error('❌ LaTeX compilation error:', compileError);
                throw compileError;
            } finally {
                process.chdir(__dirname);
            }
            
            console.log(`✅ Test ${test.name} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Test ${test.name} failed:`, error);
        }
    }
    
    console.log('\n🎉 All tests completed!');
}

// Test the function directly
async function testRenderFunction() {
    console.log('\n🔧 Testing renderGroundsToLatex function directly...');
    
    const sampleData = {
        childName: 'Test Child',
        parentName: 'Test Parent',
        schoolName: 'Test School',
        stage: 'Governors',
        exclusionDate: '01/01/2025'
    };
    
    for (const test of testPositionStatements) {
        console.log(`\n📝 Testing: ${test.name}`);
        try {
            const result = renderGroundsToLatex(test.data, sampleData, { startAt: 4, leftmargin: "6ex" });
            console.log('Result:', result);
            console.log('✅ Function test passed');
        } catch (error) {
            console.error('❌ Function test failed:', error);
        }
    }
}

// Main execution
async function main() {
    try {
        await testRenderFunction();
        await testLatexGeneration();
    } catch (error) {
        console.error('❌ Script execution failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    renderGroundsToLatex,
    escapeLatex,
    escapeLatexAndReplacePlaceholders,
    testPositionStatements
};
