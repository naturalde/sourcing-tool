import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import probe from 'probe-image-size';

// Helper function to generate item number
function generateItemNumber(createdDate: string, source: string, index: number): string {
  const date = new Date(createdDate);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  const sourcePrefix = source.toLowerCase() === 'taobao' ? 'T' : source.charAt(0).toUpperCase();
  const runningNumber = String(index + 1).padStart(3, '0');
  
  return `A${yy}${mm}${dd}-${sourcePrefix}${runningNumber}`;
}

// Helper function to fetch image as base64
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    // Ensure URL has protocol
    let url = imageUrl;
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }
    
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine image type from URL or content-type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageType = contentType.split('/')[1] || 'jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

// Helper function to calculate dimensions maintaining aspect ratio
function calculateAspectRatioDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = maxWidth;
  let height = maxWidth / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }
  
  return { width, height };
}

// Helper function to get image dimensions from base64
async function getImageDimensions(base64Image: string): Promise<{ width: number; height: number }> {
  try {
    // Extract the base64 data (remove data:image/...;base64, prefix)
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const result = await probe('data:image/jpeg;base64,' + base64Data);
    return { width: result.width, height: result.height };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    // Fallback to 1:1 aspect ratio
    return { width: 300, height: 300 };
  }
}

// Helper function to add image to PDF with aspect ratio preservation
async function addImageToPDF(doc: jsPDF, imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) {
  try {
    const base64Image = await fetchImageAsBase64(imageUrl);
    
    if (base64Image) {
      try {
        // Get image dimensions to calculate aspect ratio
        const dimensions = await getImageDimensions(base64Image);
        const { width, height } = calculateAspectRatioDimensions(
          dimensions.width,
          dimensions.height,
          maxWidth,
          maxHeight
        );
        
        // Center the image within the available space
        const xOffset = x + (maxWidth - width) / 2;
        const yOffset = y + (maxHeight - height) / 2;
        
        doc.addImage(base64Image, 'JPEG', xOffset, yOffset, width, height);
      } catch (imgError) {
        console.error('Error adding image to PDF:', imgError);
        // Fallback to placeholder
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, maxWidth, maxHeight, 'F');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Image', x + maxWidth / 2, y + maxHeight / 2, { align: 'center' });
      }
    } else {
      // Fallback to placeholder if image fetch fails
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, maxWidth, maxHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Image', x + maxWidth / 2, y + maxHeight / 2, { align: 'center' });
    }
  } catch (error) {
    console.error('Error in addImageToPDF:', error);
    // Fallback to placeholder
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, maxWidth, maxHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Image', x + maxWidth / 2, y + maxHeight / 2, { align: 'center' });
  }
}

// In-memory cache for images to avoid redundant fetches
const imageCache = new Map<string, string>();

// Helper function to fetch multiple images in parallel with caching
async function fetchImagesInParallel(imageUrls: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  // Filter out URLs that are already cached
  const urlsToFetch = imageUrls.filter(url => {
    if (imageCache.has(url)) {
      results.set(url, imageCache.get(url)!);
      return false;
    }
    return true;
  });
  
  if (urlsToFetch.length === 0) {
    return results;
  }
  
  // Fetch all uncached images in parallel
  const fetchPromises = urlsToFetch.map(async (url) => {
    try {
      const base64Image = await fetchImageAsBase64(url);
      if (base64Image) {
        imageCache.set(url, base64Image);
      }
      results.set(url, base64Image);
    } catch (error) {
      console.error(`Error fetching image ${url}:`, error);
      results.set(url, null);
    }
  });
  
  await Promise.all(fetchPromises);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { proposal, orientation = 'landscape' } = await request.json();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal data is required' },
        { status: 400 }
      );
    }

    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ===== TITLE PAGE =====
    doc.setFillColor(14, 165, 233); // Sky blue
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.text(proposal.name, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    if (proposal.client_name) {
      doc.setFontSize(20);
      doc.text(`Client: ${proposal.client_name}`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
    }
    
    doc.setFontSize(14);
    doc.text(`Status: ${proposal.status.toUpperCase()}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
    doc.text(`Created: ${new Date(proposal.created_at).toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
    doc.text(`Total Items: ${proposal.products.length}`, pageWidth / 2, pageHeight / 2 + 45, { align: 'center' });

    // ===== PRODUCT PAGES =====
    for (let index = 0; index < proposal.products.length; index++) {
      const product = proposal.products[index];
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      
      const itemNumber = generateItemNumber(proposal.created_at, product.source, index);
      
      // Item number in top left
      doc.setFontSize(12);
      doc.setFont('calibri', 'bold');
      doc.text(itemNumber, margin, margin + 5);
      
      // Left section: Images (convert PPTX coordinates to PDF mm)
      // PPTX uses inches, PDF uses mm. Convert: 1 inch = 25.4mm
      // PPTX coordinates: 0.3, 1.2, 3.5, 1.1, 0.15, 5.2, 7.5
      // Convert to mm: multiply by 25.4
      const imageStartX = 0.3 * 25.4; // ~7.6mm
      const imageStartY = 1.2 * 25.4; // ~30.5mm  
      const mainImageSize = 3.5 * 25.4 * 0.95; // Enlarge by 10% (from 0.85 to 0.95, ~83.3mm)
      
      // Main image
      if (product.image_urls && product.image_urls.length > 0) {
        await addImageToPDF(doc, product.image_urls[0], imageStartX, imageStartY, mainImageSize, mainImageSize);
        
        // Use selected secondary images if available, otherwise use cachedDetails
        const selectedImages = product.selectedSecondaryImages || [];
        const additionalImages = selectedImages.length > 0 
          ? selectedImages.map((url: string) => ({ url }))
          : (product.cachedDetails?.item_imgs || []);
        
        if (additionalImages.length > 0) {
          // Take up to 4 additional images
          const imagesToShow = additionalImages.slice(0, 4);
          
          // Layout like PPTX: vertical alignment to the right of main image
          const smallImageSize = 1.1 * 25.4 * 0.95; // Enlarge by 10% (from 0.85 to 0.95, ~26.5mm)
          const imageSpacing = 0.15 * 25.4; // ~3.8mm
          const smallImageX = imageStartX + mainImageSize + 0.2 * 25.4; // ~5.1mm from main image
          const smallImageStartY = imageStartY;
          
          // Normalize URLs
          const imageUrls = imagesToShow.map((img: { url: string }) => {
            const url = img.url.startsWith('//') ? `https:${img.url}` : img.url;
            return url;
          });
          
          // Fetch all images in parallel
          const imageResults = await fetchImagesInParallel(imageUrls);
          
          // Add images vertically to the right of main image
          for (let i = 0; i < imagesToShow.length; i++) {
            const yPos = smallImageStartY + i * (smallImageSize + imageSpacing);
            const imageUrl = imageUrls[i];
            const base64Image = imageResults.get(imageUrl);
            
            if (base64Image) {
              try {
                const dimensions = await getImageDimensions(base64Image);
                const { width, height } = calculateAspectRatioDimensions(
                  dimensions.width,
                  dimensions.height,
                  smallImageSize,
                  smallImageSize
                );
                
                // Center the image within the available space
                const xOffset = smallImageX + (smallImageSize - width) / 2;
                const yOffset = yPos + (smallImageSize - height) / 2;
                
                doc.addImage(base64Image, 'JPEG', xOffset, yOffset, width, height);
              } catch (imgError) {
                console.error(`Error adding cached image to PDF:`, imgError);
                // Fallback to placeholder
                doc.setFillColor(240, 240, 240);
                doc.rect(smallImageX, yPos, smallImageSize, smallImageSize, 'F');
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('Image', smallImageX + smallImageSize / 2, yPos + smallImageSize / 2, { align: 'center' });
              }
            } else {
              // Fallback to placeholder if image not available
              doc.setFillColor(240, 240, 240);
              doc.rect(smallImageX, yPos, smallImageSize, smallImageSize, 'F');
              doc.setFontSize(8);
              doc.setTextColor(150, 150, 150);
              doc.text('Image', smallImageX + smallImageSize / 2, yPos + smallImageSize / 2, { align: 'center' });
            }
          }
        }
      }
      
      // Right section: Details (convert PPTX coordinates to PDF mm, move left)
      const rightSectionX = (5.2 * 25.4) - (mainImageSize * 0.05); // Move left by 5% of image size
      const rightSectionWidth = 7.5 * 25.4 * 0.8; // Shorten by 20% (~152.4mm)
      let currentY = 1.2 * 25.4; // ~30.5mm
      
      // Product title
      doc.setFontSize(12); // Changed from 16 to 12
      doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
      const titleLines = doc.splitTextToSize(product.title, rightSectionWidth);
      doc.text(titleLines, rightSectionX, currentY);
      currentY += 0.8 * 25.4; // Same as PPTX (0.8 inches)
      
      // Price
      doc.setFontSize(12); // Changed from 16 to 12
      doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
      doc.setTextColor(14, 165, 233);
      doc.text(`${product.price.current} ${product.price.currency}`, rightSectionX, currentY);
      currentY += 0.4 * 25.4; // Same as PPTX (0.4 inches)
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10); // Same as PPTX
      doc.setFont('calibri', 'normal'); // Changed from helvetica to calibri
      
      // Pricing Information - match PPTX simple text layout
      doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
      doc.text('Pricing Information', rightSectionX, currentY);
      currentY += 0.25 * 25.4; // Same as PPTX (0.25 inches)
      doc.setFont('calibri', 'normal'); // Changed from helvetica to calibri
      
      // Platform
      doc.text(`Platform: ${product.source}`, rightSectionX, currentY);
      currentY += 0.15 * 25.4; // Same as PPTX (0.15 inches)
      
      // FOB Price
      doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
      doc.text('FOB Price:', rightSectionX, currentY);
      doc.setFont('calibri', 'normal'); // Changed from helvetica to calibri
      doc.text(product.fob ? `${product.fob} ${product.price.currency}` : 'N/A', rightSectionX + 35, currentY);
      currentY += 0.15 * 25.4; // Same as PPTX (0.15 inches)
      
      // ELC
      doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
      doc.text('ELC:', rightSectionX, currentY);
      doc.setFont('calibri', 'normal'); // Changed from helvetica to calibri
      doc.text(product.elc ? `${product.elc} ${product.price.currency}` : 'N/A', rightSectionX + 35, currentY);
      currentY += 0.15 * 25.4; // Same as PPTX (0.15 inches)
      
      // Description - use fresh details, cached details, or product fields
      const description = product.cachedDetails?.desc_short || product.description_short || product.description;
      if (description) {
        doc.setFont('calibri', 'bold'); // Changed from helvetica to calibri
        doc.text('Description:', rightSectionX, currentY);
        currentY += 0.3 * 25.4; // Same as PPTX (0.3 inches)
        doc.setFont('calibri', 'normal'); // Changed from helvetica to calibri
        doc.setFontSize(10); // Changed from 12 to 10
        const descLines = doc.splitTextToSize(description, rightSectionWidth);
        const maxLines = Math.floor((pageHeight - currentY - 20) / 4);
        doc.text(descLines.slice(0, maxLines), rightSectionX, currentY);
      }
      
      // Footer with page number (bottom of page)
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${index + 2} of ${proposal.products.length + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: String(error) },
      { status: 500 }
    );
  }
}
