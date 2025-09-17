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
        const { childName, parentName, schoolName, stage, exclusionDate, groundsData } = req.body;
        
        
        // Sanitize text by removing all invisible characters that cause formatting issues
        function sanitizeText(text) {
            if (!text) return '';
            
            // Log original text for debugging if it contains suspicious characters
            const suspiciousChars = /[\uFEFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFFF9-\uFFFB]/;
            if (suspiciousChars.test(text)) {
                console.log('🧹 Found suspicious characters in text, sanitizing...');
            }
            
            return text
                .normalize("NFC")
                // Remove Byte Order Mark (U+FEFF)
                .replace(/\uFEFF/g, '')
                // Remove all zero-width spaces (U+200B-U+200F)
                .replace(/[\u200B-\u200F]/g, '')
                // Remove bidirectional text control characters (U+202A-U+202E)
                .replace(/[\u202A-\u202E]/g, '')
                // Remove word joiner and other invisible characters (U+2060-U+206F)
                .replace(/[\u2060-\u206F]/g, '')
                // Remove object replacement character and other format controls (U+FFF9-U+FFFB)
                .replace(/[\uFFF9-\uFFFB]/g, '')
                // Remove all other Unicode format control characters (Cf category)
                // This includes characters like U+061C (Arabic Letter Mark), U+070F (Syriac Abbreviation Mark), etc.
                .replace(/[\u061C\u070F\u180E\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u2066\u2067\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\uFFF9\uFFFA\uFFFB]/g, '')
                // Convert NO-BREAK SPACE to normal space
                .replace(/\u00A0/g, ' ')
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
        
        // Read the LaTeX template
        const templatePath = path.join(__dirname, 'documents', 'position_statement_template.tex');
        let latexContent = await fs.readFile(templatePath, 'utf8');
        
        // Parse and validate grounds data
        let parsedGroundsData;
        try {
            parsedGroundsData = typeof groundsData === 'string' ? JSON.parse(groundsData) : groundsData;
            
            // Sanitize all text content in the grounds data to remove invisible characters
            if (parsedGroundsData && parsedGroundsData.grounds) {
                parsedGroundsData.grounds = parsedGroundsData.grounds.map(ground => ({
                    ...ground,
                    title: sanitizeText(ground.title || ''),
                    reasons: Array.isArray(ground.reasons) 
                        ? ground.reasons.map(reason => sanitizeText(reason || ''))
                        : []
                }));
            }
        } catch (parseError) {
            console.error('❌ Failed to parse grounds data:', parseError);
            throw new Error('Invalid grounds data format: ' + parseError.message);
        }
        
        console.log('📋 Parsed and sanitized grounds data:', JSON.stringify(parsedGroundsData, null, 2));
        
        // Create replacements object for placeholders
        const replacements = {
            childName: childName,
            parentName: parentName,
            schoolName: schoolName,
            stage: stage,
            exclusionDate: exclusionDate
        };
        
        // Generate LaTeX for grounds using the new function (start at 4 as requested)
        const groundsLatex = renderGroundsToLatex(parsedGroundsData, replacements, { startAt: 4, leftmargin: "6ex" });
        console.log('📄 Generated grounds LaTeX:', groundsLatex);
        
        // Generate ground titles list for the summary section
        const groundTitlesList = parsedGroundsData.grounds.map((ground, index) => {
            const title = escapeLatexAndReplacePlaceholders(ground.title || "", replacements);
            return `\\item ${title}`;
        }).join('\n        ');
        
        // Replace placeholders in the LaTeX template with escaped text
        latexContent = latexContent
            .replace(/\\newcommand{\\childName}{[^}]*}/, `\\newcommand{\\childName}{${escapeLatex(childName)}}`)
            .replace(/\\newcommand{\\parentName}{[^}]*}/, `\\newcommand{\\parentName}{${escapeLatex(parentName)}}`)
            .replace(/\\newcommand{\\schoolName}{[^}]*}/, `\\newcommand{\\schoolName}{${escapeLatex(schoolName)}}`)
            .replace(/\\newcommand{\\stage}{[^}]*}/, `\\newcommand{\\stage}{${escapeLatex(stage)}}`)
            .replace(/\\newcommand{\\exclusionDate}{[^}]*}/, `\\newcommand{\\exclusionDate}{${escapeLatex(exclusionDate)}}`);
            
        // Insert grounds into template at the "% INSERT GROUNDS HERE" comment
        latexContent = latexContent.replace('% INSERT GROUNDS HERE', groundsLatex);
        
        // Replace the groundsTitles placeholder in the template
        latexContent = latexContent.replace('\\GroundsTitlesList{\\groundsTitles}', `\\GroundsTitlesList{\n        ${groundTitlesList}\n    }`);
        
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
