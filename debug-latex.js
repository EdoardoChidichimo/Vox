#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Test data - simulating what would come from the formatPositionStatement
const testData = {
    childName: 'John Smith',
    parentName: 'Jane Smith',
    schoolName: 'Example Academy',
    stage: 'Independent Review Panel',
    exclusionDate: '15th March 2024',
    groundsTitles: 'Procedural Unfairness; Disproportionate Sanction; Failure to Consider Alternatives',
    groundReasons: 'The school failed to follow proper procedures when excluding the student | The school did not provide adequate notice of the exclusion hearing | The student was not given proper opportunity to present their case ||| The permanent exclusion is disproportionate to the alleged misconduct | The school has not considered the student\'s individual circumstances. | Alternative sanctions were not properly explored ||| The school failed to consider alternative educational provision | No assessment was made of the student\'s special educational needs | The school did not explore restorative approaches'
};

// Helper function to find pdflatex path (copied from server.js)
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

// Escape special LaTeX characters (copied from server.js)
function escapeLatex(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\textasciitilde{}');
}

async function debugLatexGeneration() {
    try {
        console.log('🔧 Starting LaTeX debugging script...');
        console.log('📋 Test data:', testData);
        
        // Read the LaTeX template
        const templatePath = path.join(__dirname, 'documents', 'position_statement_template.tex');
        let latexContent = await fs.readFile(templatePath, 'utf8');
        
        console.log('📄 Template loaded, length:', latexContent.length);
        
        // Replace placeholders in the LaTeX template with escaped text
        latexContent = latexContent
            .replace(/\\newcommand{\\childName}{[^}]*}/, `\\newcommand{\\childName}{${escapeLatex(testData.childName)}}`)
            .replace(/\\newcommand{\\parentName}{[^}]*}/, `\\newcommand{\\parentName}{${escapeLatex(testData.parentName)}}`)
            .replace(/\\newcommand{\\schoolName}{[^}]*}/, `\\newcommand{\\schoolName}{${escapeLatex(testData.schoolName)}}`)
            .replace(/\\newcommand{\\stage}{[^}]*}/, `\\newcommand{\\stage}{${escapeLatex(testData.stage)}}`)
            .replace(/\\newcommand{\\exclusionDate}{[^}]*}/, `\\newcommand{\\exclusionDate}{${escapeLatex(testData.exclusionDate)}}`)
            .replace(/\\newcommand{\\groundsTitles}{[^}]*}/, `\\newcommand{\\groundsTitles}{${escapeLatex(testData.groundsTitles)}}`)
            .replace(/\\newcommand{\\groundReasons}{[^}]*}/, `\\newcommand{\\groundReasons}{${escapeLatex(testData.groundReasons)}}`);
        
        console.log('✅ Placeholders replaced');
        
        // Create temporary directory for compilation
        const tempDir = path.join(__dirname, 'debug-temp');
        await fs.ensureDir(tempDir);
        
        console.log('📁 Created temp directory:', tempDir);
        
        // Write the modified LaTeX file
        const texFile = path.join(tempDir, 'debug_position_statement.tex');
        await fs.writeFile(texFile, latexContent);
        
        console.log('📝 LaTeX file written to:', texFile);
        
        // Copy the logo file to temp directory
        const logoSrc = path.join(__dirname, 'images', 'vox_transparent.png');
        const imagesDir = path.join(tempDir, 'images');
        const logoDest = path.join(imagesDir, 'vox_transparent.png');
        if (await fs.pathExists(logoSrc)) {
            await fs.ensureDir(imagesDir);
            await fs.copy(logoSrc, logoDest);
            console.log('🖼️ Logo copied to temp directory');
        } else {
            console.log('⚠️ Logo file not found, continuing without it');
        }
        
        // Compile LaTeX to PDF
        console.log('📄 Compiling LaTeX to PDF...');
        try {
            // Change to temp directory and compile
            process.chdir(tempDir);
            
            // Find pdflatex path
            const pdflatexPath = findPdflatexPath();
            console.log('📍 Using pdflatex at:', pdflatexPath);
            
            // Run LaTeX compilation
            try {
                const result = execSync(`"${pdflatexPath}" -interaction=nonstopmode debug_position_statement.tex`, { 
                    encoding: 'utf8',
                    timeout: 30000 // 30 seconds timeout
                });
                console.log('📄 LaTeX compilation completed normally');
                console.log('📄 Output:', result);
            } catch (compileErr) {
                console.warn('⚠️ LaTeX compilation returned exit code:', compileErr.status);
                console.warn('⚠️ LaTeX compilation stderr:', compileErr.stderr);
                console.warn('⚠️ LaTeX compilation stdout:', compileErr.stdout);
                
                // LaTeX often returns exit code 1 for warnings but still produces PDF
                console.log('🔍 Continuing to check for PDF output despite exit code...');
            }
            
            // Check if PDF was generated
            const pdfFile = path.join(tempDir, 'debug_position_statement.pdf');
            if (await fs.pathExists(pdfFile)) {
                console.log('✅ PDF generated successfully at:', pdfFile);
                
                // Copy PDF to main directory for easy access
                const finalPdfPath = path.join(__dirname, 'debug_output.pdf');
                await fs.copy(pdfFile, finalPdfPath);
                console.log('📋 PDF copied to:', finalPdfPath);
                
            } else {
                throw new Error('PDF compilation failed - no output file generated');
            }
            
        } catch (compileError) {
            console.error('❌ LaTeX compilation error:', compileError);
            throw new Error('Failed to compile LaTeX to PDF: ' + compileError.message);
        } finally {
            // Change back to original directory
            process.chdir(__dirname);
        }
        
        console.log('🎉 Debug script completed successfully!');
        console.log('📋 Check debug_output.pdf in the main directory');
        
    } catch (error) {
        console.error('❌ Debug script error:', error);
        console.error('Error stack:', error.stack);
    }
}

// Run the debug script
debugLatexGeneration();
