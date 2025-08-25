#!/usr/bin/env python3
"""
PDF to Text Converter

This script reads a PDF file and converts it to a text file with proper
line breaks and formatting for better readability.
"""

import sys
import argparse
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber is required. Install with: pip install pdfplumber")
    print("You can also try: pip install PyPDF2 for an alternative")
    sys.exit(1)

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
                        # Preserve the original line structure
                        lines = page_text.split('\n')
                        # Clean up empty lines and add page separator
                        lines = [line.strip() for line in lines if line.strip()]
                        if lines:
                            all_text.append(f"\n{'='*50}")
                            all_text.append(f"PAGE {page_num}")
                            all_text.append(f"{'='*50}\n")
                            all_text.extend(lines)
                            all_text.append("")  # Add extra line break
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
        pdf_path = "documents/statutory_guidance/behaviour_in_schools.pdf"
        if not pdf_path:
            print("No file path provided. Exiting.")
            sys.exit(1)
        
        # Get output file (optional)
        output_path = input("Enter output text file path (or press Enter for default): ").strip()
        if not output_path:
            output_path = None
        
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
