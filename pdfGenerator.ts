import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function buildDocumentationPdf(outputPath?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'NoiseWatch - Complete Platform Functionality & Technical Documentation',
          Author: 'Manish Singh (GNDEC Ludhiana)',
          Subject: 'Smart Urban Noise Pollution Monitoring Platform Documentation',
          Keywords: 'NoiseWatch, Noise Pollution, IoT, Web Audio API, Telemetry, GIS Map, Ludhiana, GNDEC',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        if (outputPath) {
          try {
            fs.writeFileSync(outputPath, pdfData);
          } catch (err) {
            console.error('Error writing PDF to disk:', err);
          }
        }
        resolve(pdfData);
      });
      doc.on('error', reject);

      // --- Color Palette ---
      const primaryColor = '#0f172a'; // Slate 900
      const secondaryColor = '#0284c7'; // Sky 600
      const accentGreen = '#059669'; // Emerald 600
      const accentIndigo = '#4f46e5'; // Indigo 600
      const accentRed = '#dc2626'; // Red 600
      const textMuted = '#475569'; // Slate 600
      const textDark = '#1e293b'; // Slate 800
      const lightBg = '#f8fafc'; // Slate 50
      const borderLine = '#cbd5e1'; // Slate 300

      // Helper functions for PDF formatting
      function drawHeaderBar(title: string, subtitle?: string) {
        doc.rect(50, doc.y, 495, 3).fill(accentIndigo);
        doc.moveDown(0.3);
        doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(title, { align: 'left' });
        if (subtitle) {
          doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold').text(subtitle, { align: 'left' });
        }
        doc.moveDown(0.6);
      }

      function addSectionHeading(num: string, text: string) {
        if (doc.y > 670) {
          doc.addPage();
        } else {
          doc.moveDown(0.8);
        }
        const y = doc.y;
        doc.rect(50, y, 4, 18).fill(secondaryColor);
        doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text(`  ${num}  ${text}`, 56, y + 2);
        doc.moveDown(0.6);
      }

      function addSubHeading(text: string) {
        if (doc.y > 700) doc.addPage();
        doc.fillColor(accentIndigo).fontSize(11).font('Helvetica-Bold').text(text);
        doc.moveDown(0.3);
      }

      function addParagraph(text: string) {
        if (doc.y > 720) doc.addPage();
        doc.fillColor(textDark).fontSize(9.5).font('Helvetica').lineGap(2.5).text(text, {
          align: 'justify'
        });
        doc.moveDown(0.4);
      }

      function addBullet(title: string, desc: string) {
        if (doc.y > 720) doc.addPage();
        doc.fillColor(accentGreen).fontSize(9).font('Helvetica-Bold').text('• ', { continued: true });
        doc.fillColor(primaryColor).font('Helvetica-Bold').text(`${title}: `, { continued: true });
        doc.fillColor(textDark).font('Helvetica').text(desc);
        doc.moveDown(0.2);
      }

      function addCalloutBox(title: string, items: string[]) {
        if (doc.y > 660) doc.addPage();
        const startY = doc.y;
        const boxHeight = 22 + items.length * 15;
        doc.rect(50, startY, 495, boxHeight).fill(lightBg);
        doc.rect(50, startY, 3, boxHeight).fill(accentIndigo);
        doc.fillColor(accentIndigo).fontSize(10).font('Helvetica-Bold').text(title, 60, startY + 6);
        let currY = startY + 20;
        items.forEach((item) => {
          doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(`  - ${item}`, 60, currY);
          currY += 14;
        });
        doc.y = startY + boxHeight + 8;
      }

      // ==========================================
      // PAGE 1: TITLE & COVER SHEET
      // ==========================================
      doc.rect(40, 40, 515, 762).stroke(borderLine);
      doc.rect(42, 42, 511, 758).stroke('#e2e8f0');

      // Top Banner
      doc.rect(42, 42, 511, 140).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('NOISEWATCH', 65, 68);
      doc.fillColor('#38bdf8').fontSize(13).font('Helvetica-Bold').text('SMART URBAN NOISE POLLUTION MONITORING PLATFORM', 65, 102);
      doc.fillColor('#94a3b8').fontSize(9.5).font('Helvetica').text('Comprehensive System Architecture, Technical Functionality & Operation Manual', 65, 122);
      doc.fillColor('#10b981').fontSize(8.5).font('Helvetica-Bold').text('OFFICIAL PROJECT COMPREHENSIVE DOCUMENTATION - VERSION 1.0.0', 65, 142);

      doc.y = 205;

      // Metadata Block
      doc.rect(55, 205, 485, 90).fill('#f1f5f9');
      doc.rect(55, 205, 4, 90).fill(accentGreen);
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('PROJECT METADATA & ACADEMIC CREDENTIALS', 70, 215);
      doc.fillColor(textDark).fontSize(9).font('Helvetica').text('Principal Developer: Manish Singh', 70, 233);
      doc.text('Institution: Guru Nanak Dev Engineering College (GNDEC), Ludhiana, Punjab, India', 70, 248);
      doc.text('Administrative Contact: manish3singh7@gmail.com', 70, 263);
      doc.text('Platform Focus: Citizen Environmental Science, IoT Decibel Telemetry, Spatial GIS Mapping', 70, 278);

      doc.y = 315;
      drawHeaderBar('1. EXECUTIVE SUMMARY & PLATFORM OBJECTIVES');
      addParagraph(
        'Noise pollution has emerged as one of the most critical, yet under-addressed, environmental hazards in rapidly expanding modern cities. High-density commercial traffic, industrial machinery, pressure horns, construction zones, and unmonitored social gatherings produce acoustic levels consistently exceeding safety thresholds established by the Central Pollution Control Board (CPCB) and World Health Organization (WHO).'
      );
      addParagraph(
        'NoiseWatch is an end-to-end civic acoustic intelligence platform created by Manish Singh from GNDEC Ludhiana. The platform bridges the gap between urban citizens and municipal administrative bodies. By transforming smartphones and web browsers into calibrated acoustic telemetry sensors, NoiseWatch enables real-time decibel measurements, frequency spectrum analysis, spatial GIS noise mapping, automated risk calculation, and an authenticated administrative command center for incident resolution.'
      );

      addCalloutBox('Key Platform Pillars', [
        'Real-Time Acoustic Telemetry: Browser-based Web Audio API decibel metering with dynamic A-weighting.',
        'Interactive Spatial GIS Map: Leaflet dark cartography visualizing live noise zones & proximity.',
        'Citizen Incident Workflow: Verified report submission with GPS auto-detection & evidence capture.',
        'Health & Exposure Intelligence: NIOSH/WHO permissible duration calculation preventing hearing loss.',
        'Centralized Admin Command: Protected dashboard for reviewing, investigating, and resolving reports.'
      ]);

      // Footer of Page 1
      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NoiseWatch System Documentation | Developed by Manish Singh (GNDEC Ludhiana)', 50, 775, { align: 'center' });

      // ==========================================
      // PAGE 2: CORE MODULES 1 & 2 (AUDIO & SPECTRUM)
      // ==========================================
      doc.addPage();
      doc.rect(40, 40, 515, 762).stroke(borderLine);

      drawHeaderBar('2. AUDIO TELEMETRY & DECIBEL ANALYSIS ENGINE');

      addSubHeading('2.1 Web Audio API Pipeline Architecture');
      addParagraph(
        'The core acoustic engine utilizes the HTML5 Web Audio API, establishing a low-latency, client-side digital signal processing (DSP) pipeline that operates entirely on-device without streaming audio recordings to the server, preserving citizen privacy while delivering real-time telemetry.'
      );
      addBullet('MediaStream Acquisition', 'Requests user microphone permission via navigator.mediaDevices.getUserMedia() with echo cancellation and auto-gain control disabled to obtain pristine ambient sound pressure levels.');
      addBullet('AudioContext & AnalyserNode', 'Initializes a high-precision AudioContext. Creates an AnalyserNode configured with an FFT size of 2048 and a smoothing time constant of 0.8.');
      addBullet('RMS & Decibel Calculation', 'Acoustic sample data is continuously polled via requestAnimationFrame(). Root Mean Square (RMS) amplitude is computed across time-domain buffers:');

      // Formula Box
      const fY = doc.y;
      doc.rect(50, fY, 495, 36).fill('#f8fafc');
      doc.rect(50, fY, 3, 36).fill(accentIndigo);
      doc.fillColor(primaryColor).fontSize(9).font('Courier-Bold').text('RMS = sqrt( (1 / N) * sum(buffer[i]^2) )', 65, fY + 8);
      doc.fillColor(accentIndigo).text('dB = 20 * log10( RMS ) + CalibrationOffset (default: +92 dB SPL)', 65, fY + 22);
      doc.y = fY + 44;

      addSubHeading('2.2 Decibel Categorization & Dynamic Gauge');
      addParagraph(
        'Calculated decibel values are mapped instantaneously to international acoustic thresholds, updating an interactive circular SVG gauge with smooth animated needle transitions and color alerts:'
      );
      addBullet('Safe / Normal (< 65 dB)', 'Green indicator. Typical residential ambient levels, light conversation, and calm libraries.');
      addBullet('Moderate Exposure (65 - 75 dB)', 'Yellow indicator. Busy office environment, restaurant chatter, moderate street traffic.');
      addBullet('High Noise Level (75 - 85 dB)', 'Orange indicator. Heavy traffic intersections, vacuum cleaners, noisy commercial hubs.');
      addBullet('Dangerous / Hazardous (> 85 dB)', 'Flashing Red indicator. Industrial zones, pressure horns, construction power tools. NIOSH threshold for auditory damage.');

      addSubHeading('2.3 Real-Time Fast Fourier Transform (FFT) Visualizer');
      addParagraph(
        'An HTML5 Canvas oscilloscope renders the frequency spectrum across 1024 distinct frequency bins, categorizing acoustic power into three essential environmental bands:'
      );
      addBullet('Low Frequency / Bass (20 - 250 Hz)', 'Captures diesel engine rumblings, heavy vehicle exhaust, construction thuds, and power generators.');
      addBullet('Mid Frequency / Speech (250 - 4000 Hz)', 'Captures human voices, street vending, and public address loudspeakers.');
      addBullet('High Frequency / Treble (4000 - 20000 Hz)', 'Captures sharp vehicle horns, metal friction, sirens, and brake squeals.');

      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NoiseWatch System Documentation | Developed by Manish Singh (GNDEC Ludhiana)', 50, 775, { align: 'center' });

      // ==========================================
      // PAGE 3: MODULES 3 & 4 (GIS MAP & REPORTING)
      // ==========================================
      doc.addPage();
      doc.rect(40, 40, 515, 762).stroke(borderLine);

      drawHeaderBar('3. SPATIAL GIS MAPPING & CITIZEN REPORTING');

      addSubHeading('3.1 Interactive Geospatial GIS Map');
      addParagraph(
        'NoiseWatch integrates Leaflet.js with CartoDB Dark Matter tile basemaps to render spatial noise distribution across urban centers. It allows citizens and civic officers to identify sound pollution clusters at a glance.'
      );
      addBullet('High-Precision GPS Location', 'Utilizes the Geolocation API (enableHighAccuracy: true) to continuously monitor the citizen’s live coordinates with dynamic accuracy pulsing circles.');
      addBullet('Sound Heat Propagation Circles', 'Surrounds each noise monitoring station and reported incident with semi-transparent rings whose color and radius scale with the recorded decibel magnitude.');
      addBullet('Proximity Telemetry Engine', 'Calculates real-time spherical distances from the user’s exact location to the nearest reported noise violations using the Haversine trigonometric formula:');

      // Formula Box
      const hY = doc.y;
      doc.rect(50, hY, 495, 30).fill('#f8fafc');
      doc.rect(50, hY, 3, 30).fill(accentIndigo);
      doc.fillColor(primaryColor).fontSize(8.5).font('Courier-Bold').text('a = sin^2(dLat/2) + cos(lat1)*cos(lat2)*sin^2(dLon/2)', 65, hY + 6);
      doc.fillColor(accentIndigo).text('Distance = 2 * EarthRadius * atan2( sqrt(a), sqrt(1-a) )', 65, hY + 18);
      doc.y = hY + 36;

      addSubHeading('3.2 Citizen Noise Pollution Incident Reporting');
      addParagraph(
        'The reporting module empowers community members to act as verified acoustic sentinels. The incident submission form captures structured environmental evidence:'
      );
      addBullet('Auto-Populated Telemetry', 'Clicking "Use Current Telemetry" transfers the live decibel reading and GPS coordinates directly into the reporting form.');
      addBullet('Source Classification', 'Categorizes violations into Traffic/Vehicular, Construction, Industrial/Machinery, Commercial/Markets, Social/Music/Events, Generator, or Domestic.');
      addBullet('Narrative Description & Timestamping', 'Detailed citizen observations are timestamped in UTC and synchronized to the server memory and UI via REST API endpoints.');
      addBullet('Live Marker Injection', 'Upon successful submission, the newly generated report is assigned an incremental ID and immediately rendered as a high-visibility marker on the GIS map.');

      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NoiseWatch System Documentation | Developed by Manish Singh (GNDEC Ludhiana)', 50, 775, { align: 'center' });

      // ==========================================
      // PAGE 4: REGULATORY COMPLIANCE & HEALTH RISK
      // ==========================================
      doc.addPage();
      doc.rect(40, 40, 515, 762).stroke(borderLine);

      drawHeaderBar('4. REGULATORY STANDARDS & HEALTH RISK ASSESSMENT');

      addSubHeading('4.1 CPCB & WHO Ambient Noise Standards');
      addParagraph(
        'Under the Noise Pollution (Regulation and Control) Rules 2000 formulated by the Central Pollution Control Board (CPCB) of India, urban territories are segregated into four defined regulatory zones:'
      );

      // Regulatory Standards Table
      const tY = doc.y;
      doc.rect(50, tY, 495, 80).fill('#f8fafc');
      doc.rect(50, tY, 495, 18).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('ZONE CLASSIFICATION', 60, tY + 5);
      doc.text('DAY LIMIT (06:00 - 22:00)', 210, tY + 5);
      doc.text('NIGHT LIMIT (22:00 - 06:00)', 360, tY + 5);

      const rows = [
        ['Industrial Zone', '75 dB(A) Leq', '70 dB(A) Leq'],
        ['Commercial Zone', '65 dB(A) Leq', '55 dB(A) Leq'],
        ['Residential Zone', '55 dB(A) Leq', '45 dB(A) Leq'],
        ['Silence Zone (Hospitals, Schools, Courts)', '50 dB(A) Leq', '40 dB(A) Leq']
      ];

      let rowY = tY + 20;
      rows.forEach((r, idx) => {
        if (idx % 2 === 1) doc.rect(50, rowY, 495, 15).fill('#edf2f7');
        doc.fillColor(textDark).fontSize(8).font('Helvetica');
        doc.text(r[0], 60, rowY + 3);
        doc.text(r[1], 210, rowY + 3);
        doc.text(r[2], 360, rowY + 3);
        rowY += 15;
      });
      doc.y = tY + 86;

      addSubHeading('4.2 Auditory & Physiological Health Risk Engine');
      addParagraph(
        'NoiseWatch integrates international occupational safety guidelines (NIOSH and WHO) to dynamically calculate the maximum safe duration of exposure before irreversible hearing damage occurs:'
      );
      addBullet('85 dB(A)', 'Maximum 8 hours per day without hearing protection.');
      addBullet('88 dB(A) (3dB Exchange Rate)', 'Maximum 4 hours per day.');
      addBullet('91 dB(A)', 'Maximum 2 hours per day.');
      addBullet('94 dB(A)', 'Maximum 1 hour per day.');
      addBullet('100 dB(A)', 'Maximum 15 minutes per day.');
      addBullet('> 110 dB(A)', 'Immediate risk of permanent sensorineural acoustic trauma.');

      addCalloutBox('Clinical Consequences of Chronic Noise Exposure', [
        'Auditory: Tinnitus (chronic phantom ringing), Permanent Threshold Shift (PTS), presbycusis acceleration.',
        'Cardiovascular: Elevated cortisol levels, autonomic nervous system stress, hypertension, arterial stiffness.',
        'Cognitive: Severe sleep disturbance, attention deficit in school-age children, elevated workplace fatigue.'
      ]);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NoiseWatch System Documentation | Developed by Manish Singh (GNDEC Ludhiana)', 50, 775, { align: 'center' });

      // ==========================================
      // PAGE 5: ADMIN COMMAND & REST API ARCHITECTURE
      // ==========================================
      doc.addPage();
      doc.rect(40, 40, 515, 762).stroke(borderLine);

      drawHeaderBar('5. ADMINISTRATIVE COMMAND & API SPECIFICATION');

      addSubHeading('5.1 Administrative Command Center & Security');
      addParagraph(
        'The administrative command center is strictly restricted to platform owner Manish Singh (`admin` or `manish3singh7@gmail.com`). It delivers robust tools for civic officials:'
      );
      addBullet('Owner Authentication', 'Secured via hashed master credentials, session cookies, and URL tokens for compatibility with cloud iframe environments.');
      addBullet('Emergency Recovery PIN System', 'Supports instant password recovery through time-limited (10-minute expiry) cryptographic one-time security codes.');
      addBullet('Incident Workflow Management', 'Officers can filter, inspect, and update report statuses across four operational phases: Open, Under Investigation, Resolved, or Dismissed.');
      addBullet('Dynamic Content Management', 'Allows instant editing of the "About Project" paragraph with atomic persistence directly to `data/about.json`.');

      addSubHeading('5.2 RESTful API Specification');
      addParagraph('NoiseWatch provides clean RESTful API endpoints for citizen telemetry and administrative workflows:');

      // API Table
      const apiY = doc.y;
      doc.rect(50, apiY, 495, 110).fill('#f8fafc');
      doc.rect(50, apiY, 495, 18).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('METHOD & ROUTE', 60, apiY + 5);
      doc.text('ACCESS', 210, apiY + 5);
      doc.text('FUNCTION & PAYLOAD', 290, apiY + 5);

      const apiRows = [
        ['GET /', 'Public', 'Serves Citizen Telemetry & GIS Dashboard'],
        ['GET /api/reports', 'Public', 'Returns JSON array of all noise reports'],
        ['POST /api/reports', 'Public', 'Creates citizen noise incident with coordinates'],
        ['GET /health', 'Public', 'Healthcheck returning uptime and status code 200'],
        ['GET /download-documentation', 'Public', 'Generates and downloads this official PDF manual'],
        ['POST /login', 'Admin', 'Authenticates admin credentials; issues auth token']
      ];

      let apiRowY = apiY + 20;
      apiRows.forEach((r, idx) => {
        if (idx % 2 === 1) doc.rect(50, apiRowY, 495, 15).fill('#edf2f7');
        doc.fillColor(textDark).fontSize(7.5).font('Courier-Bold');
        doc.text(r[0], 60, apiRowY + 3);
        doc.font('Helvetica-Bold').fillColor(r[1] === 'Admin' ? accentRed : accentGreen);
        doc.text(r[1], 210, apiRowY + 3);
        doc.font('Helvetica').fillColor(textDark);
        doc.text(r[2], 290, apiRowY + 3);
        apiRowY += 15;
      });
      doc.y = apiY + 116;

      addSubHeading('5.3 Cloud & Railway Deployment Architecture');
      addParagraph(
        'NoiseWatch is production-ready for deployment on Railway, Docker, or Google Cloud Run. The configuration utilizes multi-stage Docker builds, Nixpacks automation, and dynamic port binding (`process.env.PORT`) to ensure zero-downtime scalability.'
      );

      // Sign-off box
      const signY = doc.y + 10;
      doc.rect(50, signY, 495, 45).fill('#f1f5f9');
      doc.rect(50, signY, 3, 45).fill(accentGreen);
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('PROJECT ATTRIBUTION & SIGN-OFF', 65, signY + 8);
      doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text('Developed by: Manish Singh | Student, Guru Nanak Dev Engineering College (GNDEC), Ludhiana', 65, signY + 22);
      doc.text('Contact & Inquiries: manish3singh7@gmail.com | NoiseWatch Acoustic Platform v1.0.0', 65, signY + 34);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NoiseWatch System Documentation | Developed by Manish Singh (GNDEC Ludhiana)', 50, 775, { align: 'center' });

      // Finalize the PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
