# ProofPass Platform - Demo Recording Guide

Complete guide for recording professional platform demonstrations suitable for presentations, conferences, and promotional materials.

**Author**: Fernando Boiero <fboiero@frvm.utn.edu.ar>
**Last Updated**: November 2025

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Recording Setup](#recording-setup)
- [Demo Script](#demo-script)
- [Recording the Demo](#recording-the-demo)
- [Post-Production](#post-production)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The ProofPass Platform demo showcases:

1. **W3C Verifiable Credentials** - Standards-compliant credential creation
2. **Digital Product Passports** - Multi-credential aggregation
3. **Stellar Blockchain Integration** - Real-time anchoring on testnet
4. **QR Code Generation** - Mobile-friendly verification
5. **End-to-End Verification** - Complete validation workflow

**Demo Duration**: ~5-7 minutes
**Target Audience**: Technical and non-technical stakeholders

---

## Prerequisites

### System Requirements

```bash
# Verify Node.js version (>=20.0.0)
node --version

# Verify dependencies installed
npm install

# Verify Stellar configuration
grep STELLAR_SECRET_KEY .env
```

### Required Tools

**For Recording:**
- Screen recording software:
  - macOS: QuickTime Player or ScreenFlow
  - Windows: OBS Studio or Camtasia
  - Linux: SimpleScreenRecorder or OBS Studio
- Terminal with good font rendering
- Minimum resolution: 1920x1080 (1080p)

**For Terminal Setup:**
- Font: Menlo, Monaco, or Fira Code (14-16pt)
- Color scheme: Dark background for better contrast
- Window size: 80x24 minimum (adjust for your recording area)

---

## Recording Setup

### 1. Prepare Your Environment

```bash
# Clean terminal history
clear
history -c

# Set up Stellar keys (if not already done)
npm run setup:stellar

# Verify system health
npm run health
```

### 2. Configure Terminal

```bash
# macOS Terminal preferences
- Profile: Pro or Basic (dark background)
- Font: Monaco 16pt or Menlo 16pt
- Window size: 120 columns x 30 rows
- Cursor: Block, blinking

# Or use iTerm2 with these settings:
- Profile: Dark Background
- Font: Fira Code 16pt with ligatures
- Colors: Solarized Dark or Dracula
```

### 3. Prepare Recording Area

1. Close unnecessary applications
2. Hide desktop icons (macOS: `defaults write com.apple.finder CreateDesktop false && killall Finder`)
3. Disable notifications:
   - macOS: Enable "Do Not Disturb"
   - Windows: Enable "Focus Assist"
4. Set screen resolution to 1920x1080
5. Position terminal window in center

---

## Demo Script

### Quick Demo (3-5 minutes)

```bash
# Run the standard Stellar demo
npm run demo:stellar
```

**What it shows:**
- W3C Verifiable Credential creation
- Digital Passport generation
- Stellar blockchain anchoring
- Cryptographic proof generation
- Transaction verification on Stellar Explorer

### Complete Demo (5-7 minutes)

```bash
# Run the comprehensive platform demo with QR codes
npm run demo:recording
```

**What it shows:**
- Scenario 1: Educational credential issuance
- Scenario 2: Product passport with supply chain
- Scenario 3: Blockchain anchoring on Stellar
- Scenario 4: End-to-end verification
- QR codes for mobile verification
- Complete statistics and metrics

### Interactive Demo (8-12 minutes)

```bash
# Run the full platform demo with manual pacing
scripts/demo-complete.sh
```

**What it shows:**
- All features from complete demo
- Docker service startup
- API endpoint overview
- Platform UI walkthrough
- Demo report generation

---

## Recording the Demo

### Step-by-Step Recording Process

#### 1. Pre-Recording Checklist

- [ ] Terminal configured with proper font and colors
- [ ] Screen resolution set to 1920x1080
- [ ] Notifications disabled
- [ ] Stellar keys configured in .env
- [ ] Recording software tested and ready
- [ ] Audio configured (if recording narration)
- [ ] Quiet environment secured

#### 2. Start Recording

**macOS (QuickTime):**
```bash
# Open QuickTime Player
# File > New Screen Recording
# Select recording area (full screen or custom)
# Click Record button
```

**OBS Studio (all platforms):**
```bash
# Configure scene with Display Capture
# Audio: Set to Desktop Audio + Microphone (if narrating)
# Output: 1920x1080, 60fps, High quality
# Click "Start Recording"
```

#### 3. Execute Demo

```bash
# Option A: Automated demo (recommended for first recording)
npm run demo:recording

# Option B: Stellar-focused demo
npm run demo:stellar

# Option C: Full platform demo with interaction
DEMO_SPEED=normal scripts/demo-complete.sh
```

#### 4. Stop Recording

- Wait 2-3 seconds after demo completes
- Stop recording
- Save file with descriptive name: `proofpass-demo-YYYYMMDD.mp4`

---

## Post-Production

### Video Editing

**Recommended Tools:**
- iMovie (macOS, free)
- DaVinci Resolve (cross-platform, free)
- Adobe Premiere Pro (professional)
- Camtasia (user-friendly, paid)

**Editing Steps:**

1. **Trim** excess footage from beginning and end
2. **Add intro slide** (2-3 seconds):
   ```
   ProofPass Platform
   W3C Verifiable Credentials & Blockchain Integration
   ```
3. **Add title overlays** for each scenario:
   - "Creating Educational Credential"
   - "Building Product Passport"
   - "Anchoring on Stellar Blockchain"
   - "End-to-End Verification"
4. **Add outro slide** (3-5 seconds):
   ```
   Try ProofPass Platform
   github.com/PROOFPASS/ProofPassPlatform
   ```
5. **Add background music** (optional, subtle, royalty-free)
6. **Adjust speed** if demo runs too long:
   - Speed up installation/loading sections (1.5x-2x)
   - Keep normal speed for important demonstrations

### Narration (Optional)

**Script Template:**

```text
[INTRO]
"Welcome to ProofPass Platform, a production-ready solution for W3C
Verifiable Credentials and Digital Product Passports with blockchain integration."

[SCENARIO 1]
"First, we'll create an educational credential for a university degree.
Notice the W3C-compliant structure and Ed25519 cryptographic signature."

[SCENARIO 2]
"Next, we'll demonstrate a supply chain use case. We create multiple
credentials tracking a product from farm to consumer, then aggregate
them into a Digital Product Passport."

[SCENARIO 3]
"Now comes the most important part: anchoring this passport on the
Stellar blockchain. This creates an immutable, publicly-verifiable
proof that this credential existed at this moment in time."

[SCENARIO 4]
"Finally, we verify the complete credential chain, from signature
validation to blockchain proof verification."

[OUTRO]
"ProofPass Platform is open source and ready for production use.
Visit our GitHub repository to get started."
```

### Export Settings

**For YouTube/Vimeo:**
- Format: MP4 (H.264)
- Resolution: 1920x1080 (1080p)
- Frame rate: 30 or 60 fps
- Bitrate: 8-12 Mbps
- Audio: AAC, 192 kbps, 48kHz

**For Conference Presentations:**
- Format: MP4 (H.264)
- Resolution: 1920x1080 or 3840x2160 (4K if venue supports)
- Frame rate: 30 fps
- Bitrate: 10-15 Mbps
- Audio: AAC, 256 kbps, 48kHz

**For Social Media:**
- Format: MP4 (H.264)
- Resolution: 1280x720 or 1920x1080
- Frame rate: 30 fps
- Bitrate: 5-8 Mbps
- Duration: Under 2 minutes (edit down to highlights)
- Add subtitles/captions

---

## Best Practices

### Terminal Appearance

✅ **Do:**
- Use high contrast colors (light text on dark background)
- Choose readable monospace fonts (14-18pt)
- Keep terminal window at reasonable size (not full screen)
- Use dark theme (easier on eyes, professional look)

❌ **Don't:**
- Use light themes (harsh on screen recording)
- Use tiny fonts (viewer can't read)
- Maximize terminal (looks amateur)
- Use complex color schemes (distracting)

### Recording Quality

✅ **Do:**
- Record at 1920x1080 minimum
- Use 60fps for smooth animations
- Keep audio levels consistent
- Test recording setup first
- Have backup recording running

❌ **Don't:**
- Record at low resolution (looks pixelated)
- Use webcam audio (poor quality)
- Record with notifications on
- Forget to check audio before starting

### Demo Execution

✅ **Do:**
- Run demo at normal speed
- Let QR codes display fully (3-5 seconds)
- Pause after important outputs
- Show blockchain explorer verification
- End with clear call-to-action

❌ **Don't:**
- Rush through important parts
- Skip verification steps
- Close windows too quickly
- Forget to show final statistics

---

## Troubleshooting

### Common Issues

**Issue: Demo fails to start**
```bash
# Check Stellar keys
grep STELLAR_SECRET_KEY .env

# If not set, run setup
npm run setup:stellar

# Verify key format (should start with 'S')
```

**Issue: QR codes not displaying**
```bash
# Verify qrcode-terminal installed
npm list qrcode-terminal

# If missing, install
npm install --save-dev qrcode-terminal
```

**Issue: Stellar transaction fails**
```bash
# Check Stellar account has balance
npm run cli stellar:balance

# If empty, fund account using Stellar Friendbot:
# https://laboratory.stellar.org/#account-creator?network=test
```

**Issue: Terminal colors not showing**
```bash
# Ensure terminal supports ANSI colors
echo -e "\033[32mGreen text\033[0m"

# If not working, try different terminal:
# macOS: iTerm2
# Windows: Windows Terminal
# Linux: GNOME Terminal or Terminator
```

**Issue: Recording is choppy/laggy**
```bash
# Close resource-intensive applications
# Reduce recording resolution temporarily
# Ensure sufficient disk space (>10GB free)
# Restart computer before recording
```

### Performance Optimization

```bash
# Close Docker if not needed for demo
docker-compose down

# Clear terminal before recording
clear && printf '\033[3J'

# Increase Node.js memory if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Pre-load dependencies
npm run demo:stellar  # Run once to cache

# Then record
npm run demo:recording
```

---

## Demo Variations

### For Technical Audiences

Focus on:
- Cryptographic implementation details
- W3C standards compliance
- Blockchain transaction structure
- API integration examples
- Code architecture

```bash
# Use detailed output mode
DEMO_SPEED=slow npm run demo:recording
```

### For Business Audiences

Focus on:
- Use cases and business value
- Supply chain transparency
- Credential verification
- Cost savings
- ROI potential

```bash
# Use faster, business-focused demo
npm run demo:fast
```

### For Conference Presentations

- Create 90-second highlight reel
- Focus on one compelling use case
- Add professional intro/outro
- Include call-to-action slide
- Provide QR code to GitHub repo

---

## Recording Checklist

**Before Recording:**
- [ ] Terminal configured and tested
- [ ] Demo runs successfully (test run)
- [ ] Stellar keys configured
- [ ] Notifications disabled
- [ ] Screen resolution set
- [ ] Recording software ready
- [ ] Quiet environment
- [ ] Sufficient disk space

**During Recording:**
- [ ] Clean terminal before starting
- [ ] Start recording
- [ ] Execute demo command
- [ ] Let QR codes display fully
- [ ] Wait for complete finish
- [ ] Stop recording

**After Recording:**
- [ ] Review footage for quality
- [ ] Trim beginning/end
- [ ] Add titles and outro
- [ ] Export at proper settings
- [ ] Test playback before sharing
- [ ] Upload to platform
- [ ] Share with team

---

## Resources

**Demo Scripts:**
- `npm run demo:recording` - Full platform demo with QR codes
- `npm run demo:stellar` - Stellar-focused demo
- `npm run demo` - Interactive complete demo
- `scripts/demo-platform-recording.ts` - Source code

**Documentation:**
- [Getting Started](GETTING_STARTED.md)
- [API Reference](API_REFERENCE.md)
- [Architecture Overview](architecture/TECHNICAL_ARCHITECTURE.md)

**Recording Tools:**
- [OBS Studio](https://obsproject.com/) - Free, cross-platform
- [ScreenFlow](https://www.telestream.net/screenflow/) - macOS, paid
- [Camtasia](https://www.techsmith.com/video-editor.html) - Cross-platform, paid

**Editing Software:**
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve/) - Free
- [iMovie](https://www.apple.com/imovie/) - macOS, free
- [Shotcut](https://shotcut.org/) - Free, cross-platform

---

## Example Recording Timeline

**Total Duration: 5-7 minutes**

| Time | Section | Content |
|------|---------|---------|
| 0:00 | Intro | Title slide + platform overview |
| 0:10 | Setup | Show Stellar configuration |
| 0:30 | Scenario 1 | Educational credential |
| 1:30 | Scenario 2 | Product passport |
| 3:00 | Scenario 3 | Blockchain anchoring |
| 4:30 | Scenario 4 | Verification |
| 5:30 | Summary | Statistics and capabilities |
| 6:00 | Outro | Call-to-action + GitHub link |

---

## Contact & Support

**Questions about recording?**
- Open an issue: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- Email: fboiero@frvm.utn.edu.ar

**Share your recording:**
- Tag us on social media
- Add to [Discussions](https://github.com/PROOFPASS/ProofPassPlatform/discussions)
- Submit to community showcase

---

**Happy recording! 🎥**
