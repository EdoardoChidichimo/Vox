#!/usr/bin/env python3
"""
PDF to Text Converter

This script reads a PDF file and converts it to a text file with proper
line breaks and formatting for better readability.
"""

import sys
import argparse
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber is required. Install with: pip install pdfplumber")
    print("You can also try: pip install PyPDF2 for an alternative")
    sys.exit(1)

def join_paragraph_lines(lines):
    """
    Join lines that belong to the same paragraph.
    
    Args:
        lines: List of text lines from a page
        
    Returns:
        List of paragraphs (each as a single string)
    """
    paragraphs = []
    current_paragraph = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:  # Empty line indicates paragraph break
            if current_paragraph:
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
            continue
        
        # Check if this line should start a new paragraph
        should_start_new_paragraph = False
        
        # Common indicators for new paragraphs:
        # 1. Starts with number and period (e.g., "1.", "2.")
        starts_with_number = bool(re.match(r'^\d+\.', line))
        
        # 2. Starts with bullet points
        starts_with_bullet = line.startswith('•') or line.startswith('-') or line.startswith('*')
        
        # 3. Likely headings (short lines, all caps, or ending with colon)
        is_likely_heading = (len(line) < 80 and 
                           (line.isupper() or line.endswith(':') or 
                            re.match(r'^[A-Z][a-z]+', line)))
        
        # 4. Check if previous line ended with sentence punctuation
        prev_line_ends_sentence = (i > 0 and current_paragraph and 
                                 current_paragraph[-1].endswith(('.', '?', '!')))
        
        # 5. Check if current line starts with lowercase (likely continuation)
        starts_with_lowercase = line and line[0].islower()
        
        # 6. Check if line is very short and doesn't end with sentence punctuation
        is_short_line = len(line) < 60 and not line.endswith(('.', '?', '!'))
        
        # 7. Check for specific patterns that indicate new paragraphs
        is_section_header = (re.match(r'^[A-Z][a-z\s]+$', line) and len(line) < 100)
        
        # Determine if this should start a new paragraph
        if (starts_with_number or starts_with_bullet or is_likely_heading or 
            is_section_header or 
            (is_short_line and not starts_with_lowercase and not current_paragraph)):
            should_start_new_paragraph = True
        
        # Additional logic: if previous line ended with sentence and current line
        # doesn't start with lowercase, it might be a new paragraph
        elif prev_line_ends_sentence and not starts_with_lowercase and not is_short_line:
            should_start_new_paragraph = True
        
        # If we should start a new paragraph, save the current one
        if should_start_new_paragraph and current_paragraph:
            paragraphs.append(' '.join(current_paragraph))
            current_paragraph = []
        
        current_paragraph.append(line)
    
    # Add the last paragraph if there is one
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    return paragraphs

def convert_pdf_to_text(pdf_path: str, output_path: str = None, preserve_layout: bool = True):
    """
    Convert PDF to text with proper line breaks.
    
    Args:
        pdf_path: Path to the input PDF file
        output_path: Path for the output text file (optional)
        preserve_layout: Whether to preserve the original layout structure
    """
    
    pdf_file = Path(pdf_path)
    
    if not pdf_file.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        return False
    
    if output_path is None:
        output_path = pdf_file.with_suffix('.txt')
    
    try:
        print(f"Converting {pdf_file.name} to text...")
        
        with pdfplumber.open(pdf_file) as pdf:
            all_text = []
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}/{len(pdf.pages)}...")
                
                # Extract text from the page
                page_text = page.extract_text()
                
                if page_text:
                    if preserve_layout:
                        # Split into lines and process for paragraph structure
                        lines = page_text.split('\n')
                        
                        # Clean up lines and remove empty ones
                        lines = [line.strip() for line in lines if line.strip()]
                        
                        if lines:
                            # Add page separator
                            # all_text.append(f"\n{'='*50}")
                            # all_text.append(f"PAGE {page_num}")
                            # all_text.append(f"{'='*50}\n")
                            
                            # Process lines into paragraphs
                            paragraphs = join_paragraph_lines(lines)
                            
                            # Add paragraphs with proper spacing
                            for i, paragraph in enumerate(paragraphs):
                                all_text.append(paragraph)
                                # Add line break between paragraphs, but not after the last one
                                if i < len(paragraphs) - 1:
                                    all_text.append("")
                    else:
                        # Simple text extraction
                        all_text.append(f"\n--- PAGE {page_num} ---\n")
                        all_text.append(page_text)
                        all_text.append("")
                else:
                    print(f"Warning: No text found on page {page_num}")
            
            # Write to output file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(all_text))
            
            print(f"Successfully converted PDF to: {output_path}")
            print(f"Total pages processed: {len(pdf.pages)}")
            
            # Show file size comparison
            pdf_size = pdf_file.stat().st_size
            txt_size = Path(output_path).stat().st_size
            print(f"PDF size: {pdf_size:,} bytes")
            print(f"Text file size: {txt_size:,} bytes")
            
            return True
            
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return False

def main():
    """Main function to handle command line arguments and run conversion."""
    parser = argparse.ArgumentParser(
        description="Convert PDF files to text with proper line breaks"
    )
    parser.add_argument(
        'input_pdf',
        help='Path to the input PDF file'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output text file path (default: same name with .txt extension)'
    )
    parser.add_argument(
        '--simple',
        action='store_true',
        help='Use simple text extraction (less layout preservation)'
    )
    
    args = parser.parse_args()
    
    # Convert the PDF
    success = convert_pdf_to_text(
        args.input_pdf,
        args.output,
        preserve_layout=not args.simple
    )
    
    if success:
        print("\nConversion completed successfully!")
        sys.exit(0)
    else:
        print("\nConversion failed!")
        sys.exit(1)

if __name__ == "__main__":
    # If no command line arguments, provide interactive mode
    if len(sys.argv) == 1:
        print("PDF to Text Converter")
        print("=" * 30)
        
        # Get input file
        pdf_path = "documents/statutory_guidance/suspensions.pdf"
        if not pdf_path:
            print("No file path provided. Exiting.")
            sys.exit(1)
        
        output_path = "documents/statutory_guidance/suspensions.txt"
        
        # Ask about layout preservation
        preserve = input("Preserve layout structure? (y/n, default: y): ").strip().lower()
        preserve_layout = preserve != 'n'
        
        # Convert
        success = convert_pdf_to_text(pdf_path, output_path, preserve_layout)
        
        if success:
            print("\nConversion completed successfully!")
        else:
            print("\nConversion failed!")
    else:
        main()
