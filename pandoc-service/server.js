const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse raw text
app.use((req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type'] === 'text/plain') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.body = data;
      next();
    });
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'pandoc-api' });
});

// Convert endpoint
app.post('/convert', (req, res) => {
  try {
    const text = req.body;
    const from = req.query.from || 'plain';
    const to = req.query.to || 'docx';
    
    console.log('Received request:', { from, to, textLength: text?.length });
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'No text provided or invalid format',
        receivedType: typeof text,
        receivedValue: text
      });
    }
    
    const trimmedText = text.trim();
    if (trimmedText === '') {
      return res.status(400).json({ error: 'Empty text provided' });
    }
    
    // Create unique file names
    const timestamp = Date.now();
    const inputPath = `/tmp/input-${timestamp}.txt`;
    const outputPath = `/tmp/output-${timestamp}.${to}`;
    
    // Write text to temporary file
    fs.writeFileSync(inputPath, trimmedText, 'utf8');
    
    // Convert using pandoc
    const command = `pandoc "${inputPath}" -f ${from} -t ${to} -o "${outputPath}"`;
    console.log('Executing command:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Pandoc error:', error);
        console.error('Stderr:', stderr);
        
        // Clean up
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        
        return res.status(500).json({ 
          error: 'Conversion failed', 
          details: stderr || error.message 
        });
      }
      
      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: 'Output file not created' });
      }
      
      // Send the file
      res.setHeader('Content-Type', getMimeType(to));
      res.setHeader('Content-Disposition', `attachment; filename="converted.${to}"`);
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);
      
      // Clean up after sending
      fileStream.on('end', () => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        console.log('Conversion successful, files cleaned up');
      });
      
      fileStream.on('error', (err) => {
        console.error('Stream error:', err);
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      });
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Helper function to get MIME type
function getMimeType(extension) {
  const mimeTypes = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pdf': 'application/pdf',
    'html': 'text/html',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'odt': 'application/vnd.oasis.opendocument.text'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pandoc API service running on port ${PORT}`);
});