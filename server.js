const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Parse JSON bodies with increased limit for large documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
        const { execSync } = require('child_process');
        const result = execSync('which pdflatex', { encoding: 'utf8', timeout: 5000 });
        return result.trim();
    } catch (error) {
        throw new Error('pdflatex not found. Please install LaTeX.');
    }
}

// Proxy endpoint for Ollama Cloud API
app.post('/api/ollama-proxy', async (req, res) => {
    try {
        const { endpoint, apiKey, requestBody } = req.body;
        
        console.log('🔄 Proxying request to Ollama Cloud:', endpoint);
        
        const response = await fetch(`https://ollama.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ollama API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        
        const data = await response.json();
        console.log('✅ Ollama API response received');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for status check
app.get('/api/ollama-status', async (req, res) => {
    try {
        const { apiKey } = req.query;
        
        console.log('🔍 Checking Ollama Cloud status...');
        
        const response = await fetch('https://ollama.com/api/tags', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Service check failed' });
        }
        
        const data = await response.json();
        console.log('✅ Ollama Cloud status check successful');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { childName, parentName, schoolName, stage, exclusionDate, groundsTitles, groundReasons } = req.body;
        
        console.log('🔄 Generating PDF for:', childName);
        console.log('📋 Request data:', { childName, parentName, schoolName, stage, exclusionDate, groundsTitles, groundReasons });
        
        // Sanitize text by removing invisible/spacing characters that can cause formatting issues
        function sanitizeText(text) {
            if (!text) return '';
            
            // Log original text for debugging if it contains suspicious characters
            const suspiciousChars = /[\u200B-\u200D\uFEFF\u2060-\u2064\u00AD\u200E\u200F\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\u2028\u2029\u202A-\u202E\u061C]/;
            if (suspiciousChars.test(text)) {
                console.log('🧹 Found suspicious characters in text, sanitizing...');
            }
            
            return text
                .normalize("NFC")
                // Remove zero-width and invisible characters
                .replace(/[\u200B-\u200D\uFEFF\u2060-\u2064\u00AD\u200E\u200F\u202A-\u202E\u061C]/g, '')
                // Replace unusual spaces with normal space
                .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
                // Replace line and paragraph separators with normal newline
                .replace(/[\u2028\u2029]/g, '\n')
                // Remove control characters except newline, carriage return, tab
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
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
                .replace(/~/g, '\\textasciitilde{}')
                .replace(/'/g, "\\'")
                .replace(/'/g, "\\'")
                .replace(/'/g, "\\'");
        }
        
        // Read the LaTeX template
        const templatePath = path.join(__dirname, 'documents', 'position_statement_template.tex');
        let latexContent = await fs.readFile(templatePath, 'utf8');
        
        // Sanitize the LLM response data to remove invisible characters
        const sanitizedGroundsTitles = sanitizeText(groundsTitles);
        const sanitizedGroundReasons = sanitizeText(groundReasons);
        
        // Log sanitized content for debugging
        console.log('🧹 Sanitized groundsTitles length:', sanitizedGroundsTitles.length);
        console.log('🧹 Sanitized groundReasons length:', sanitizedGroundReasons.length);
        
        // Replace placeholders in the LaTeX template with escaped text
        latexContent = latexContent
            .replace(/\\newcommand{\\childName}{[^}]*}/, `\\newcommand{\\childName}{${escapeLatex(childName)}}`)
            .replace(/\\newcommand{\\parentName}{[^}]*}/, `\\newcommand{\\parentName}{${escapeLatex(parentName)}}`)
            .replace(/\\newcommand{\\schoolName}{[^}]*}/, `\\newcommand{\\schoolName}{${escapeLatex(schoolName)}}`)
            .replace(/\\newcommand{\\stage}{[^}]*}/, `\\newcommand{\\stage}{${escapeLatex(stage)}}`)
            .replace(/\\newcommand{\\exclusionDate}{[^}]*}/, `\\newcommand{\\exclusionDate}{${escapeLatex(exclusionDate)}}`)
            .replace(/\\newcommand{\\groundsTitles}{[^}]*}/, `\\newcommand{\\groundsTitles}{${escapeLatex(sanitizedGroundsTitles)}}`)
            .replace(/\\newcommand{\\groundReasons}{[^}]*}/, `\\newcommand{\\groundReasons}{${escapeLatex(sanitizedGroundReasons)}}`);
        
        // Replace square bracket placeholders in groundsTitles and groundReasons with LaTeX command format
        const placeholderReplacements = {
            '[childName]': '\\childName\\',
            '[parentName]': '\\parentName\\',
            '[schoolName]': '\\schoolName\\',
            '[stage]': '\\stage\\',
            '[exclusionDate]': '\\exclusionDate\\'
        };
        
        // Apply placeholder replacements to groundsTitles and groundReasons
        for (const [placeholder, replacement] of Object.entries(placeholderReplacements)) {
            latexContent = latexContent.replace(new RegExp(placeholder.replace(/[\[\]]/g, '\\$&'), 'g'), replacement);
        }
        
        // Create temporary directory for compilation
        const tempDir = path.join(__dirname, 'temp', Date.now().toString());
        await fs.ensureDir(tempDir);
        
        // Write the modified LaTeX file
        const texFile = path.join(tempDir, 'position_statement.tex');
        await fs.writeFile(texFile, latexContent);
        
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
            // Change to temp directory and compile
            process.chdir(tempDir);
            
            // Find pdflatex path
            const pdflatexPath = findPdflatexPath();
            console.log('📍 Using pdflatex at:', pdflatexPath);
            
            // Run LaTeX compilation (may return exit code 1 even with successful PDF generation)
            try {
                const result = execSync(`"${pdflatexPath}" -interaction=nonstopmode position_statement.tex`, { 
                    encoding: 'utf8',
                    timeout: 30000 // 30 seconds timeout
                });
                console.log('📄 LaTeX compilation completed normally:', result);
            } catch (compileErr) {
                console.warn('⚠️ LaTeX compilation returned exit code:', compileErr.status);
                console.warn('⚠️ LaTeX compilation stderr:', compileErr.stderr);
                console.warn('⚠️ LaTeX compilation stdout:', compileErr.stdout);
                
                // LaTeX often returns exit code 1 for warnings but still produces PDF
                // We'll check for PDF existence rather than failing immediately
                console.log('🔍 Continuing to check for PDF output despite exit code...');
            }
            
            // Check if PDF was generated
            const pdfFile = path.join(tempDir, 'position_statement.pdf');
            if (await fs.pathExists(pdfFile)) {
                // Read the PDF file and send as response
                const pdfBuffer = await fs.readFile(pdfFile);
                
                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="Position_Statement_${childName.replace(/\s+/g, '_')}.pdf"`);
                res.send(pdfBuffer);
                
                console.log('✅ PDF generated successfully');
                
                // Clean up temp directory
                setTimeout(async () => {
                    try {
                        await fs.remove(path.dirname(tempDir));
                    } catch (cleanupError) {
                        console.warn('⚠️ Failed to clean up temp directory:', cleanupError);
                    }
                }, 5000);
                
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
        
    } catch (error) {
        console.error('❌ PDF generation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'PDF generation failed', 
            details: error.message,
            stack: error.stack,
            suggestion: 'Please ensure LaTeX is installed on the system (e.g., sudo apt-get install texlive-full)'
        });
    }
});

// Test endpoint to check LaTeX availability
app.get('/api/test-latex', async (req, res) => {
    try {
        console.log('🧪 Testing LaTeX installation...');
        
        // Test if pdflatex is available
        const { execSync } = require('child_process');
        const pdflatexPath = findPdflatexPath();
        const latexVersion = execSync(`"${pdflatexPath}" --version`, { encoding: 'utf8', timeout: 5000 });
        
        res.json({
            status: 'success',
            message: 'LaTeX is available',
            version: latexVersion.split('\n')[0]
        });
        
    } catch (error) {
        console.error('❌ LaTeX test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'LaTeX is not available',
            details: error.message,
            suggestion: 'Install LaTeX: brew install --cask mactex (macOS) or sudo apt-get install texlive-full (Ubuntu)'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'VoxLLM proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 VoxLLM proxy server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.resolve('.')}`);
    console.log(`🔗 Test page: http://localhost:${PORT}/test-llm-api.html`);
    console.log(`🔗 Main app: http://localhost:${PORT}/voxllm.html`);
});
